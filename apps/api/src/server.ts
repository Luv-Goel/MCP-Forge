import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import type { FastifyInstance, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import { packages } from './routes/packages.ts';
import { releases } from './routes/releases.ts';
import { search } from './routes/search.ts';
import { analysis } from './routes/analysis.ts';
import { health } from './routes/health.ts';
import { stats } from './routes/stats.ts';
import { config } from './config.ts';
import { seedIfEmpty } from './seed.ts';

export async function buildServer(): Promise<FastifyInstance> {
    const fastify = Fastify({
        logger: {
            level: config.logLevel,
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
        },
    });

    await seedIfEmpty();

    // Request logging for every request
    fastify.addHook('preHandler', (request, _reply, done) => {
        request.log.info({ method: request.method, url: request.url }, 'incoming request');
        done();
    });

    // Request ID: accept inbound x-request-id, otherwise generate one.
    fastify.addHook('onRequest', (request, reply, done) => {
        const id = (request.headers['x-request-id'] as string) ?? randomUUID();
        request.headers['x-request-id'] = id;
        reply.header('x-request-id', id);
        done();
    });

    await fastify.register(helmet);
    await fastify.register(sensible);
    await fastify.register(cors, { origin: config.corsOrigin === '*' ? true : config.corsOrigin });
    await fastify.register(rateLimit, {
        max: config.rateLimit.max,
        timeWindow: config.rateLimit.timeWindow,
    });

    // Structured error responses
    fastify.setErrorHandler((error, _request, reply: FastifyReply) => {
        if (error.statusCode && error.statusCode < 500) {
            reply.status(error.statusCode).send({ error: error.code ?? 'BAD_REQUEST', message: error.message });
        } else {
            reply.log.error(error, 'unhandled error');
            reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
        }
    });

    // Health endpoint (top-level)
    await fastify.register(health, { prefix: '/health' });

    // Registry statistics
    await fastify.register(stats, { prefix: '/v1/stats' });

    // Versioned API
    await fastify.register(packages, { prefix: '/v1/packages' });
    await fastify.register(releases, { prefix: '/v1/packages' });
    await fastify.register(analysis, { prefix: '/v1/packages' });
    await fastify.register(search, { prefix: '/v1/search' });

    return fastify;
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

export async function start(): Promise<void> {
    const server = await buildServer();
    await server.listen({ port: config.port, host: config.host });

    const shutdown = async (signal: string) => {
        server.log.info({ signal }, 'shutting down gracefully');
        await server.close();
        process.exit(0);
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

if (isMain) {
    void start();
}
