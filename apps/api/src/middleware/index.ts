import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import { env } from '../config/env.js';

/**
 * Register all middleware plugins
 */
export async function registerMiddleware(fastify: FastifyInstance): Promise<void> {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
  });

  // CORS - allow requests from desktop app
  await fastify.register(cors, {
    origin: env.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Sensible defaults (better error handling, utilities)
  await fastify.register(sensible);

  // Request logging in development
  if (env.NODE_ENV === 'development') {
    fastify.addHook('onRequest', async request => {
      fastify.log.info(`→ ${request.method} ${request.url}`);
    });

    fastify.addHook('onResponse', async (request, reply) => {
      fastify.log.info(`← ${request.method} ${request.url} ${reply.statusCode}`);
    });
  }
}
