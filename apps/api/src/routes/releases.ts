import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { store } from '../store.ts';

const ReleaseSchema = z.object({
    version: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$/),
    published_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
    manifest_version: z.string().default('1.0'),
    changelog: z.string().optional(),
    signatures: z
        .object({
            maintainer: z.string().optional(),
            forge: z.string().optional(),
        })
        .optional(),
});

export const releases: FastifyPluginAsync = async (fastify) => {
    // GET /v1/packages/:slug/releases
    fastify.get<{ Params: { slug: string } }>('/:slug/releases', async (request, reply) => {
        const { slug } = request.params;
        const pkg = await store.getPackage(slug);
        if (!pkg) {
            return reply.status(404).send({ error: 'NOT_FOUND', message: `Package '${slug}' not found` });
        }
        return { slug, releases: await store.listReleases(slug) };
    });

    // POST /v1/packages/:slug/releases — publish a new release
    fastify.post<{ Params: { slug: string } }>('/:slug/releases', async (request, reply) => {
        const { slug } = request.params;
        const pkg = await store.getPackage(slug);
        if (!pkg) {
            return reply.status(404).send({ error: 'NOT_FOUND', message: `Package '${slug}' not found` });
        }
        const parsed = ReleaseSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'BAD_REQUEST',
                details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
            });
        }
        const release = { ...parsed.data, slug, published_at: parsed.data.published_at };
        const releases = await store.addRelease(slug, release);
        return reply.status(201).send({ slug, release, releases });
    });

    // GET /v1/packages/:slug/releases/:version
    fastify.get<{ Params: { slug: string; version: string } }>(
        '/:slug/releases/:version',
        async (request, reply) => {
            const { slug, version } = request.params;
            const pkg = await store.getPackage(slug);
            if (!pkg) {
                return reply.status(404).send({ error: 'NOT_FOUND', message: `Package '${slug}' not found` });
            }
            const all = await store.listReleases(slug);
            const release = all.find((r) => r.version === version);
            if (!release) {
                return reply.status(404).send({ error: 'NOT_FOUND', message: `Release '${version}' not found` });
            }
            return { slug, release };
        },
    );
};
