import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { searchIndex } from '../services/search.ts';

const PackageSchema = z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    transports: z.array(z.string()),
    primitives: z.object({
        tools: z.boolean().optional(),
        prompts: z.boolean().optional(),
        resources: z.boolean().optional(),
        sampling: z.boolean().optional(),
    }),
    auth: z.object({ type: z.string() }),
    stars: z.number().default(0),
    verified: z.boolean().default(false),
    updatedAt: z.string().optional(),
});

export const packages: FastifyPluginAsync = async (fastify) => {
    // GET /v1/packages
    fastify.get('/', async (request, reply) => {
        const results = await searchIndex.all();
        return { packages: results };
    });

    // GET /v1/packages/:slug
    fastify.get<{ Params: { slug: string } }>(
        '/:slug',
        async (request, reply) => {
            const { slug } = request.params;
            const pkg = await searchIndex.bySlug(slug);
            if (!pkg) return reply.status(404).send({ error: 'NOT_FOUND', message: `Package '${slug}' not found` });
            return pkg;
        },
    );

    // POST /v1/packages — register a new package
    fastify.post(
        '/',
        async (request, reply) => {
            const parsed = PackageSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.status(400).send({ error: 'BAD_REQUEST', details: parsed.error.message });
            }
            const pkg = parsed.data;
            await searchIndex.upsert(pkg);
            return reply.status(201).send(pkg);
        },
    );
};
