import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const SANDBOX_SCRIPT = path.resolve(process.cwd(), '..', '..', 'packages', 'runtime', 'src', 'sandbox.py');
const MAX_PAYLOAD = 64 * 1024;

// Simple in-memory per-minute rate limiter (10 requests/min per process).
const hits = new Map<number, number>();

function isRateLimited(): { limited: boolean; used: number; bucket: number } {
    const now = Date.now();
    const bucket = Math.floor(now / 60_000);
    // Prune buckets older than the current one so the map never grows unbounded.
    if (hits.size > 5) {
        for (const key of hits.keys()) {
            if (key < bucket - 1) hits.delete(key);
        }
    }
    const used = (hits.get(bucket) ?? 0) + 1;
    hits.set(bucket, used);
    return { limited: used > 10, used, bucket };
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'BAD_REQUEST', message: 'Expected a JSON body' }, { status: 400 });
    }
    const slug = String(body.package ?? '').trim();
    const request = body.request ?? { method: 'tools/list', params: {} };
    if (!slug) {
        return NextResponse.json({ error: 'BAD_REQUEST', message: 'Missing package slug' }, { status: 400 });
    }
    if (JSON.stringify(body).length > MAX_PAYLOAD) {
        return NextResponse.json({ error: 'PAYLOAD_TOO_LARGE', message: 'Request payload too large' }, { status: 413 });
    }

    const { limited, used, bucket } = isRateLimited();
    if (limited) {
        return NextResponse.json(
            { error: 'RATE_LIMITED', message: 'Rate limit exceeded (10 requests/min)' },
            { status: 429 },
        );
    }

    // Resolve the package manifest from the registry API.
    let manifest: unknown;
    try {
        const res = await fetch(`${API_BASE}/v1/packages/${encodeURIComponent(slug)}`, { cache: 'no-store' });
        if (!res.ok) {
            return NextResponse.json(
                { error: 'NOT_FOUND', message: `Package '${slug}' not found in registry` },
                { status: 404 },
            );
        }
        const data = await res.json();
        // Strip release history before handing the manifest to the sandbox.
        const { releases: _releases, ...rest } = data;
        manifest = rest;
    } catch {
        return NextResponse.json(
            { error: 'UPSTREAM_UNAVAILABLE', message: 'Registry API unreachable' },
            { status: 503 },
        );
    }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-sandbox-'));
    const manifestFile = path.join(tmpDir, 'mcp.package.json');
    const requestFile = path.join(tmpDir, 'request.json');
    await fs.writeFile(manifestFile, JSON.stringify(manifest));
    await fs.writeFile(requestFile, JSON.stringify(request));

    const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
        const repoRoot = path.resolve(process.cwd(), '..', '..');
        const py = spawn('python3', [SANDBOX_SCRIPT, manifestFile, requestFile, '--timeout', '15'], {
            cwd: repoRoot,
        });
        let stdout = '';
        let stderr = '';
        py.stdout.setEncoding('utf8');
        py.stderr.setEncoding('utf8');
        py.stdout.on('data', (d) => (stdout += d));
        py.stderr.on('data', (d) => (stderr += d));
        py.on('close', (code) => resolve({ code, stdout, stderr }));
    });

    await fs.rm(tmpDir, { recursive: true, force: true });

    let parsed: Record<string, unknown> | null = null;
    try {
        parsed = JSON.parse(result.stdout);
    } catch {
        /* fall through */
    }

    if (result.code !== 0) {
        const detail = (parsed?.error ?? result.stderr.trim()) || 'Sandbox produced no valid output';
        return NextResponse.json({ error: 'SANDBOX_ERROR', message: String(detail), details: parsed }, { status: 422 });
    }
    return NextResponse.json({ rateLimit: { limit: 10, remaining: Math.max(0, 10 - used), reset: (bucket + 1) * 60_000 }, ...parsed });
}
