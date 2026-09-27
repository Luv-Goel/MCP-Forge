import { FastifyPluginAsync } from 'fastify';
import { searchIndex } from '../services/search.ts';
export const search: FastifyPluginAsync = async (fastify) => {
    fastify.get<{ Querystring: { q: string } }>(
        '/',
        async (request) => {
            const q = (request.query as any).q ?? '';
            const all = await searchIndex.all();
            const results = all.filter((p) =>
                p.name.toLowerCase().includes(q.toLowerCase()) ||
                p.description.toLowerCase().includes(q.toLowerCase())
            );
            return { query: q, results };
        },
    );
};
