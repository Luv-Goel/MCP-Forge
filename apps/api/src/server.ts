import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import { packages } from './routes/packages.ts';
import { releases } from './routes/releases.ts';
import { search } from './routes/search.ts';
import { health } from './routes/health.ts';

const fastify = Fastify({
    logger: {
        level: process.env['LOG_LEVEL'] ?? 'info',
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

await fastify.register(cors, { origin: true });
await fastify.register(helmet);
await fastify.register(sensible);
await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
});

// Health endpoint (top-level, authenticated)
await fastify.register(health, { prefix: '/health' });

// Versioned API
await fastify.register(packages, { prefix: '/v1/packages' });
await fastify.register(releases, { prefix: '/v1/packages' });
await fastify.register(search, { prefix: '/v1/search' });

// Never trust the client
fastify.addHook('preHandler', (request, _reply, done) => {
    fastify.log.info({ method: request.method, url: request.url }, 'incoming request');
    done();
});

const port = Number.parseInt(process.env['PORT'] ?? '8080', 10);
await fastify.listen({ port, host: '0.0.0.0' });
