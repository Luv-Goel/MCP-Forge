import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { store } from '../store.ts';
import { queryPackages } from '../services/search.ts';

const PrimitiveSchema = z.object({
    tools: z.boolean().optional(),
    prompts: z.boolean().optional(),
    resources: z.boolean().optional(),
    sampling: z.boolean().optional(),
});

export const PackageSchema = z.object({
    name: z.string().min(1).max(120),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must match ^[a-z0-9]+(-[a-z0-9]+)*$'),
    description: z.string().min(10).max(500),
    transports: z.array(z.enum(['stdio', 'streamable-http', 'sse'])).min(1),
    primitives: PrimitiveSchema.default({}),
    auth: z.object({ type: z.enum(['none', 'api_key', 'oauth', 'bearer']), env_var: z.string().optional() }).default({ type: 'none' }),
    runtime: z.record(z.unknown()).optional(),
    scopes: z.array(z.record(z.unknown())).optional(),
    stars: z.number().min(0).default(0),
    verified: z.boolean().default(false),
    updatedAt: z.string().optional(),
    version: z.string().optional(),
    homepage: z.string().url().optional(),
    license: z.string().optional(),
    tags: z.array(z.string()).optional(),
    releases: z.array(z.record(z.unknown())).optional(),
});

const listQuerySchema = z.object({
    q: z.string().optional(),
    transport: z.string().optional(),
    auth: z.string().optional(),
    primitive: z.string().optional(),
    verified: z.enum(['true', 'false']).optional(),
    sort: z.enum(['updated', 'stars', 'name']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
});

export const packages: FastifyPluginAsync = async (fastify) => {
    // GET /v1/packages?q=&transport=&auth=&sort=&limit=&offset=
    fastify.get('/', async (request, reply) => {
        const parsed = listQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'BAD_REQUEST', details: parsed.error.flatten() });
        }
        const q = parsed.data;
        return queryPackages({
            q: q.q,
            transport: q.transport,
            auth: q.auth,
            primitive: q.primitive,
            verified: q.verified === undefined ? undefined : q.verified === 'true',
            sort: q.sort,
            limit: q.limit,
            offset: q.offset,
        });
    });

    // GET /v1/packages/:slug
    fastify.get<{ Params: { slug: string } }>(
        '/:slug',
        async (request, reply) => {
            const { slug } = request.params;
            const pkg = await store.getPackage(slug);
            if (!pkg) {
                return reply.status(404).send({ error: 'NOT_FOUND', message: `Package '${slug}' not found` });
            }
            const releases = await store.listReleases(slug);
            return { ...pkg, releases };
        },
    );

    // POST /v1/packages — register a new package
    fastify.post('/', async (request, reply) => {
        const parsed = PackageSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'BAD_REQUEST',
                details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
            });
        }
        const pkg = parsed.data;
        const existing = await store.getPackage(pkg.slug);
        if (existing) {
            return reply.status(409).send({
                error: 'CONFLICT',
                message: `Package '${pkg.slug}' already exists; use PUT to update it`,
            });
        }
        await store.putPackage(pkg);
        return reply.status(201).send(pkg);
    });

    // PUT /v1/packages/:slug — full update
    fastify.put<{ Params: { slug: string } }>('/:slug', async (request, reply) => {
        const parsed = PackageSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'BAD_REQUEST',
                details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
            });
        }
        if (parsed.data.slug !== request.params.slug) {
            return reply.status(400).send({
                error: 'BAD_REQUEST',
                message: `URL slug '${request.params.slug}' does not match body slug '${parsed.data.slug}'`,
            });
        }
        const existing = await store.getPackage(request.params.slug);
        if (!existing) {
            return reply.status(404).send({ error: 'NOT_FOUND', message: `Package '${request.params.slug}' not found` });
        }
        await store.putPackage(parsed.data);
        return parsed.data;
    });

    // DELETE /v1/packages/:slug
    fastify.delete<{ Params: { slug: string } }>('/:slug', async (request, reply) => {
        const deleted = await store.deletePackage(request.params.slug);
        if (!deleted) {
            return reply.status(404).send({ error: 'NOT_FOUND', message: `Package '${request.params.slug}' not found` });
        }
        return reply.status(204).send();
    });
};
