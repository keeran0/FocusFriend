import type { FastifyPluginAsync } from 'fastify';
import type { HealthCheckResponse } from '../types/index.js';
import { successResponse } from '../utils/index.js';

// Track server start time for uptime calculation
const startTime = Date.now();

const healthRoutes: FastifyPluginAsync = async fastify => {
  /**
   * GET /health
   * Basic health check - used by load balancers and monitoring
   */
  fastify.get('/health', async (_request, reply) => {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;

    const healthData: HealthCheckResponse = {
      status: 'healthy',
      version: process.env.npm_package_version || '0.0.1',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        // Database check will be added later
        memory: {
          used: usedMemory,
          total: totalMemory,
          percentage: Math.round((usedMemory / totalMemory) * 100),
        },
      },
    };

    return reply.send(successResponse(healthData));
  });

  /**
   * GET /health/ready
   * Readiness check - is the server ready to accept requests?
   */
  fastify.get('/health/ready', async (_request, reply) => {
    // Add checks for dependencies (database, cache, etc.)
    const isReady = true; // Will add actual checks later

    if (isReady) {
      return reply.send(successResponse({ ready: true }));
    }

    return reply.status(503).send(successResponse({ ready: false }));
  });

  /**
   * GET /health/live
   * Liveness check - is the server process alive?
   */
  fastify.get('/health/live', async (_request, reply) => {
    return reply.send(successResponse({ alive: true }));
  });
};

export default healthRoutes;
