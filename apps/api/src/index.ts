import Fastify from 'fastify';
import { env } from './config/env.js';
import { registerMiddleware } from './middleware/index.js';
import routes from './routes/index.js';
import healthRoutes from './routes/health.js';
import { prisma, disconnectPrisma } from './lib/prisma.js';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    transport:
      env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// Bootstrap the application
async function bootstrap(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('✓ Database connected');

    // Register middleware
    await registerMiddleware(fastify);

    // Register health routes at ROOT level (no prefix)
    await fastify.register(healthRoutes);

    // Register API routes with prefix
    await fastify.register(routes, { prefix: env.API_PREFIX });

    // Root endpoint
    fastify.get('/', async () => ({
      name: 'Focus Friend API',
      version: '0.0.1',
      documentation: `${env.API_PREFIX}/docs`,
    }));

    // Start the server
    await fastify.listen({
      port: env.PORT,
      host: env.HOST,
    });

    const serverUrl = `http://${env.HOST}:${env.PORT}`;

    // eslint-disable-next-line no-console
    console.log(`
🎯 Focus Friend API Server

   Environment: ${env.NODE_ENV}
   Server:      ${serverUrl}
   Health:      ${serverUrl}/health
   API:         ${serverUrl}${env.API_PREFIX}
`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Handle graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received, shutting down gracefully...`);

  try {
    await fastify.close();
    await disconnectPrisma();
    // eslint-disable-next-line no-console
    console.log('Server and database connections closed');
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start the server
bootstrap();
