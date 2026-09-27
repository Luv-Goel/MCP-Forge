import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs';
import type { FastifyInstance } from 'fastify';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-forge-api-'));
process.env.DATA_FILE = path.join(tmpDir, 'test-packages.json');
process.env.LOG_LEVEL = 'warn';

// Import after env is configured so the singleton store targets a temp file.
let buildServer: () => Promise<FastifyInstance>;
let seedIfEmpty: () => Promise<void>;

beforeAll(async () => {
    ({ buildServer } = await import('../src/server.ts'));
    ({ seedIfEmpty } = await import('../src/seed.ts'));
    await seedIfEmpty();
});

afterAll(() => {
    vi.clearAllMocks();
});

const VALID_PACKAGE = {
    name: 'Test Package',
    slug: 'test-package',
    description: 'A package used for automated API testing of the registry.',
    transports: ['stdio'],
    primitives: { tools: true },
    auth: { type: 'none' },
    runtime: { type: 'python', entrypoint: ['python3', '-m', 'server'] },
    scopes: [{ name: 'filesystem', paths: ['/tmp'] }],
    stars: 0,
    verified: false,
};

describe('MCP Forge API', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await buildServer();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /health returns ok', async () => {
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(200);
        expect(res.json().ok).toBe(true);
    });

    it('GET /v1/packages returns seeded packages with pagination metadata', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(Array.isArray(body.items)).toBe(true);
        expect(body.items.length).toBeGreaterThan(0);
        expect(body.total).toBe(body.items.length);
    });

    it('GET /v1/packages/:slug returns a package', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages/filesystem-tools' });
        expect(res.statusCode).toBe(200);
        expect(res.json().slug).toBe('filesystem-tools');
    });

    it('GET /v1/packages/missing returns 404', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages/does-not-exist' });
        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('NOT_FOUND');
    });

    it('POST /v1/packages creates a package and persists it', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/packages',
            payload: VALID_PACKAGE,
        });
        expect(res.statusCode).toBe(201);
        expect(res.json().slug).toBe('test-package');

        const fetched = await app.inject({ method: 'GET', url: '/v1/packages/test-package' });
        expect(fetched.statusCode).toBe(200);
        expect(fetched.json().name).toBe('Test Package');
    });

    it('POST /v1/packages returns 409 for a duplicate slug', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/packages',
            payload: { ...VALID_PACKAGE, description: 'A second attempt at the same slug, long enough to validate.' },
        });
        expect(res.statusCode).toBe(409);
        expect(res.json().error).toBe('CONFLICT');
    });

    it('PUT /v1/packages/:slug rejects a slug mismatch', async () => {
        const res = await app.inject({
            method: 'PUT',
            url: '/v1/packages/test-package',
            payload: { ...VALID_PACKAGE, slug: 'other-slug' },
        });
        expect(res.statusCode).toBe(400);
        expect(res.json().error).toBe('BAD_REQUEST');
    });

    it('POST /v1/packages rejects invalid payloads', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/packages',
            payload: { name: 'x', slug: 'BAD SLUG', description: 'short', transports: ['ftp'] },
        });
        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.error).toBe('BAD_REQUEST');
        expect(Array.isArray(body.details)).toBe(true);
        expect(body.details.length).toBeGreaterThan(0);
    });

    it('PUT /v1/packages/:slug updates a package', async () => {
        const res = await app.inject({
            method: 'PUT',
            url: '/v1/packages/test-package',
            payload: { ...VALID_PACKAGE, description: 'An updated description that is long enough to pass.', stars: 5 },
        });
        expect(res.statusCode).toBe(200);
        expect(res.json().stars).toBe(5);
    });

    it('DELETE /v1/packages/:slug removes a package', async () => {
        const res = await app.inject({ method: 'DELETE', url: '/v1/packages/test-package' });
        expect(res.statusCode).toBe(204);

        const fetched = await app.inject({ method: 'GET', url: '/v1/packages/test-package' });
        expect(fetched.statusCode).toBe(404);
    });

    it('GET /v1/search finds packages by query', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/search?q=filesystem' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.total).toBeGreaterThan(0);
        expect(body.results?.[0] ?? body.items?.[0]).toBeDefined();
    });

    it('GET /v1/search supports transport and auth filters', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/search?transport=streamable-http' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        for (const item of body.items ?? []) {
            expect(item.transports).toContain('streamable-http');
        }
    });

    it('POST /v1/packages/:slug/releases publishes a release', async () => {
        const pkg = await app.inject({ method: 'POST', url: '/v1/packages', payload: VALID_PACKAGE });
        expect(pkg.statusCode).toBe(201);

        const res = await app.inject({
            method: 'POST',
            url: '/v1/packages/test-package/releases',
            payload: {
                version: '1.0.0',
                published_at: '2026-07-20T00:00:00Z',
                changelog: 'Initial release',
            },
        });
        expect(res.statusCode).toBe(201);
        expect(res.json().release.version).toBe('1.0.0');
    });

    it('GET /v1/packages/:slug/releases/:version returns a specific release', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages/test-package/releases/1.0.0' });
        expect(res.statusCode).toBe(200);
        expect(res.json().release.version).toBe('1.0.0');
    });

    it('GET /v1/packages/:slug/releases/:version returns 404 for missing version', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages/test-package/releases/9.9.9' });
        expect(res.statusCode).toBe(404);
    });

    it('paginated list respects limit and offset', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages?limit=1&offset=0&sort=name' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.items.length).toBe(1);
        expect(body.limit).toBe(1);
    });

    it('invalid query params return 400', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages?limit=abc' });
        expect(res.statusCode).toBe(400);
    });

    it('GET /v1/stats returns registry statistics', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/stats' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.packages).toBeGreaterThan(0);
        expect(typeof body.verified).toBe('number');
        expect(typeof body.transports).toBe('object');
        expect(typeof body.auth).toBe('object');
        expect(body.total_stars).toBeGreaterThanOrEqual(0);
    });

    it('GET /health includes uptime and registry counts', async () => {
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.ok).toBe(true);
        expect(typeof body.uptime_s).toBe('number');
        expect(body.registry.packages).toBeGreaterThan(0);
    });

    it('GET /v1/packages/:slug/trust returns an explainable score', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages/filesystem-tools/trust' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(typeof body.total).toBe('number');
        expect(body.total).toBeGreaterThanOrEqual(0);
        expect(body.total).toBeLessThanOrEqual(1);
        expect(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']).toContain(body.grade);
        expect(Array.isArray(body.factors)).toBe(true);
        expect(body.factors.length).toBeGreaterThan(0);
    });

    it('GET /v1/packages/:slug/compat returns a compatibility matrix', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages/filesystem-tools/compat' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(Array.isArray(body.compatible_clients)).toBe(true);
        expect(Array.isArray(body.matrix)).toBe(true);
        expect(body.matrix.length).toBeGreaterThan(0);
    });

    it('GET /v1/packages/:slug/install returns configs for all clients', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages/filesystem-tools/install' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body['claude-desktop']).toBeDefined();
        expect(body['docker-compose']).toBeDefined();
        expect(typeof body['claude-desktop']).toBe('string');
    });

    it('GET /v1/packages/:slug/install?client= filters by client', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages/filesystem-tools/install?client=vscode' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(Object.keys(body)).toEqual(['vscode']);
    });

    it('GET /v1/packages/:slug/install rejects unknown client', async () => {
        const res = await app.inject({ method: 'GET', url: '/v1/packages/filesystem-tools/install?client=nope' });
        expect(res.statusCode).toBe(400);
    });

    it('analysis endpoints return 404 for missing packages', async () => {
        for (const path of ['trust', 'compat', 'install']) {
            const res = await app.inject({ method: 'GET', url: `/v1/packages/ghost/${path}` });
            expect(res.statusCode).toBe(404);
        }
    });

    it('responses include a request id header', async () => {
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.headers['x-request-id']).toBeTruthy();
    });
});
