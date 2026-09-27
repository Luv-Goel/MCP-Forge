import type { FastifyPluginAsync } from 'fastify';
import { store } from '../store.ts';

const STARTED_AT = Date.now();
const VERSION = '0.2.0';

export const health: FastifyPluginAsync = async (fastify) => {
    fastify.get('/', async () => {
        const packages = await store.allPackages();
        const verified = packages.filter((p) => p.verified).length;
        return {
            ok: true,
            ts: new Date().toISOString(),
            uptime_s: Math.round((Date.now() - STARTED_AT) / 1000),
            version: VERSION,
            registry: {
                packages: packages.length,
                verified,
            },
        };
    });
};
