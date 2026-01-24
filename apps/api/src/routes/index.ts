import type { FastifyPluginAsync } from 'fastify';
import authRoutes from './auth.js';

const routes: FastifyPluginAsync = async fastify => {
  // Auth routes: /api/v1/auth/*
  await fastify.register(authRoutes, { prefix: '/auth' });

  // Placeholder route to verify API prefix works
  fastify.get('/status', async () => ({
    message: 'API is running',
    prefix: '/api/v1',
  }));

  // Future routes will be registered here:
  // await fastify.register(userRoutes, { prefix: '/users' });
  // await fastify.register(sessionRoutes, { prefix: '/sessions' });
};

export default routes;
