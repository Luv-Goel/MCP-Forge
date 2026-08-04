/**
 * Install config generators (TypeScript mirror of packages/client-templates).
 */
import type { PackageRecord } from '../store.ts';

const CLIENTS = ['claude-desktop', 'openai-compatible', 'vscode', 'docker-compose', 'json-manifest'] as const;
type ClientId = (typeof CLIENTS)[number];

function claudeDesktop(pkg: PackageRecord): string {
    const runtime = (pkg.runtime ?? {}) as Record<string, unknown>;
    const entry = (runtime.entrypoint as string[]) ?? ['python', '-m', 'server'];
    const env = (runtime.env ?? {}) as Record<string, unknown>;
    return JSON.stringify(
        {
            mcpServers: {
                [pkg.slug]: {
                    command: entry[0],
                    args: entry.slice(1),
                    env: Object.fromEntries(
                        Object.entries(env)
                            .filter(([, v]) => v === 'required')
                            .map(([k]) => [k, '']),
                    ),
                },
            },
        },
        null,
        2,
    );
}

function openAiCompatible(pkg: PackageRecord): string {
    const runtime = (pkg.runtime ?? {}) as Record<string, unknown>;
    const url = (runtime.url as string) ?? `https://${pkg.slug}.mcp.run`;
    const envVar = pkg.auth?.env_var ?? 'API_KEY';
    return JSON.stringify(
        {
            mcpServers: {
                [pkg.slug]: {
                    url,
                    headers: { Authorization: `Bearer $${envVar}` },
                },
            },
        },
        null,
        2,
    );
}

function dockerCompose(pkg: PackageRecord): string {
    const runtime = (pkg.runtime ?? {}) as Record<string, unknown>;
    const image = (runtime.image as string) ?? `ghcr.io/mcp-forge/${pkg.slug}`;
    const env = (runtime.env ?? {}) as Record<string, unknown>;
    const service: Record<string, unknown> = {
        image,
        environment: Object.fromEntries(
            Object.entries(env)
                .filter(([, v]) => v === 'required')
                .map(([k]) => [k, '']),
        ),
    };
    const network = (runtime.network ?? {}) as Record<string, unknown>;
    if (!network.required) {
        service.network_mode = 'none';
    }
    return JSON.stringify(
        {
            services: { [pkg.slug]: service },
        },
        null,
        2,
    );
}

function rawManifest(pkg: PackageRecord): string {
    return JSON.stringify(pkg, null, 2);
}

export function generateForClient(pkg: PackageRecord, client: ClientId): string {
    switch (client) {
        case 'claude-desktop':
        case 'vscode':
            return claudeDesktop(pkg);
        case 'openai-compatible':
            return openAiCompatible(pkg);
        case 'docker-compose':
            return dockerCompose(pkg);
        case 'json-manifest':
            return rawManifest(pkg);
    }
}

export function generateInstallConfigs(pkg: PackageRecord, client?: string): Record<string, string> {
    if (client) {
        const id = client as ClientId;
        if (!CLIENTS.includes(id)) {
            throw new Error(`Unknown client: ${client}. Choose from: ${CLIENTS.join(', ')}`);
        }
        return { [id]: generateForClient(pkg, id) };
    }
    const results: Record<string, string> = {};
    for (const c of CLIENTS) {
        results[c] = generateForClient(pkg, c);
    }
    return results;
}
