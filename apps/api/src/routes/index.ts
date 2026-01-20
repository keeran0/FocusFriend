import type { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async fastify => {
  // API routes will be registered here with /api/v1 prefix
  // Health routes are registered at root level in main index.ts

  // Placeholder route to verify API prefix works
  fastify.get('/status', async () => ({
    message: 'API is running',
    prefix: '/api/v1',
  }));

  // Future routes will be registered here:
  // await fastify.register(authRoutes, { prefix: '/auth' });
  // await fastify.register(userRoutes, { prefix: '/users' });
  // await fastify.register(sessionRoutes, { prefix: '/sessions' });
};

export default routes;
