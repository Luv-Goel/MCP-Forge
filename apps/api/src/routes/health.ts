import { FastifyPluginAsync } from 'fastify';
export const health: FastifyPluginAsync = async (fastify) => {
    fastify.get('/', async () => {
        return { ok: true, ts: new Date().toISOString() };
    });
};
