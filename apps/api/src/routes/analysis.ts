import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { store } from '../store.ts';
import { computeTrustScore } from '../services/trust.ts';
import { buildMatrix, getClients } from '../services/compat.ts';
import { generateInstallConfigs } from '../services/install.ts';

const clientQuery = z.object({
    client: z.string().optional(),
});

export const analysis: FastifyPluginAsync = async (fastify) => {
    // GET /v1/packages/:slug/trust
    fastify.get<{ Params: { slug: string } }>('/:slug/trust', async (request, reply) => {
        const pkg = await store.getPackage(request.params.slug);
        if (!pkg) {
            return reply.status(404).send({ error: 'NOT_FOUND', message: `Package '${request.params.slug}' not found` });
        }
        return computeTrustScore(pkg);
    });

    // GET /v1/packages/:slug/compat
    fastify.get<{ Params: { slug: string } }>('/:slug/compat', async (request, reply) => {
        const pkg = await store.getPackage(request.params.slug);
        if (!pkg) {
            return reply.status(404).send({ error: 'NOT_FOUND', message: `Package '${request.params.slug}' not found` });
        }
        return buildMatrix(pkg);
    });

    // GET /v1/packages/:slug/install?client=<id>
    fastify.get<{ Params: { slug: string } }>('/:slug/install', async (request, reply) => {
        const pkg = await store.getPackage(request.params.slug);
        if (!pkg) {
            return reply.status(404).send({ error: 'NOT_FOUND', message: `Package '${request.params.slug}' not found` });
        }
        const parsed = clientQuery.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'BAD_REQUEST', details: parsed.error.flatten() });
        }
        try {
            return generateInstallConfigs(pkg, parsed.data.client);
        } catch (err) {
            return reply.status(400).send({ error: 'BAD_REQUEST', message: (err as Error).message });
        }
    });

    // GET /v1/packages/:slug/compat/clients — supported client list
    fastify.get<{ Params: { slug: string } }>('/:slug/compat/clients', async (request, reply) => {
        const pkg = await store.getPackage(request.params.slug);
        if (!pkg) {
            return reply.status(404).send({ error: 'NOT_FOUND', message: `Package '${request.params.slug}' not found` });
        }
        return getClients();
    });
};
