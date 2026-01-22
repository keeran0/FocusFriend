import type { FastifyPluginAsync } from 'fastify';
import type { HealthCheckResponse } from '../types/index.js';
import { successResponse } from '../utils/index.js';
import { prisma } from '../lib/prisma.js';

// Track server start time for uptime calculation
const startTime = Date.now();

const healthRoutes: FastifyPluginAsync = async fastify => {
  /**
   * GET /health
   * Detailed health check with database status
   */
  fastify.get('/health', async (_request, reply) => {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;

    // Check database connection
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    const isHealthy = dbStatus === 'connected';

    const healthData: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'degraded',
      version: process.env.npm_package_version || '0.0.1',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        database: dbStatus,
        memory: {
          used: usedMemory,
          total: totalMemory,
          percentage: Math.round((usedMemory / totalMemory) * 100),
        },
      },
    };

    const statusCode = isHealthy ? 200 : 503;
    return reply.status(statusCode).send(successResponse(healthData));
  });

  /**
   * GET /health/ready
   * Readiness check - is the server ready to accept requests?
   */
  fastify.get('/health/ready', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.send(successResponse({ ready: true }));
    } catch {
      return reply.status(503).send(successResponse({ ready: false }));
    }
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
