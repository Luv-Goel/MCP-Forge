import type { FastifyPluginAsync } from 'fastify';
import { computeStats } from '../services/stats.ts';

export const stats: FastifyPluginAsync = async (fastify) => {
    // GET /v1/stats
    fastify.get('/', async () => {
        return computeStats();
    });
};
