import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { queryPackages } from '../services/search.ts';

const querySchema = z.object({
    q: z.string().max(200).optional(),
    transport: z.string().optional(),
    auth: z.string().optional(),
    primitive: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
});

export const search: FastifyPluginAsync = async (fastify) => {
    fastify.get('/', async (request, reply) => {
        const parsed = querySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'BAD_REQUEST', details: parsed.error.flatten() });
        }
        const { q, transport, auth, primitive, limit, offset } = parsed.data;
        const result = await queryPackages({
            q: q ?? '',
            transport,
            auth,
            primitive,
            limit,
            offset,
            sort: 'updated',
        });
        return { query: q ?? '', ...result };
    });
};
