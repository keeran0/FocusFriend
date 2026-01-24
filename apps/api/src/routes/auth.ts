/**
 * Authentication routes
 */

import type { FastifyPluginAsync } from 'fastify';
import { successResponse, errorResponse } from '../utils/index.js';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  getUserById,
  AuthError,
} from '../services/auth.service.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema.js';
import { requireAuth } from '../middleware/auth.js';

const authRoutes: FastifyPluginAsync = async fastify => {
  /**
   * POST /auth/register
   * Register a new user
   */
  fastify.post('/register', async (request, reply) => {
    try {
      // Validate request body
      const parseResult = registerSchema.safeParse(request.body);

      if (!parseResult.success) {
        const errors = parseResult.error.flatten().fieldErrors;
        return reply.status(400).send(errorResponse('VALIDATION_ERROR', 'Invalid input', errors));
      }

      const result = await registerUser(parseResult.data);

      return reply.status(201).send(successResponse(result));
    } catch (error) {
      if (error instanceof AuthError) {
        return reply.status(error.statusCode).send(errorResponse(error.code, error.message));
      }
      throw error;
    }
  });

  /**
   * POST /auth/login
   * Login with email and password
   */
  fastify.post('/login', async (request, reply) => {
    try {
      // Validate request body
      const parseResult = loginSchema.safeParse(request.body);

      if (!parseResult.success) {
        const errors = parseResult.error.flatten().fieldErrors;
        return reply.status(400).send(errorResponse('VALIDATION_ERROR', 'Invalid input', errors));
      }

      const result = await loginUser(parseResult.data);

      return reply.send(successResponse(result));
    } catch (error) {
      if (error instanceof AuthError) {
        return reply.status(error.statusCode).send(errorResponse(error.code, error.message));
      }
      throw error;
    }
  });

  /**
   * POST /auth/refresh
   * Get new access token using refresh token
   */
  fastify.post('/refresh', async (request, reply) => {
    try {
      // Validate request body
      const parseResult = refreshTokenSchema.safeParse(request.body);

      if (!parseResult.success) {
        const errors = parseResult.error.flatten().fieldErrors;
        return reply.status(400).send(errorResponse('VALIDATION_ERROR', 'Invalid input', errors));
      }

      const tokens = await refreshAccessToken(parseResult.data.refreshToken);

      return reply.send(successResponse({ tokens }));
    } catch (error) {
      if (error instanceof AuthError) {
        return reply.status(error.statusCode).send(errorResponse(error.code, error.message));
      }
      throw error;
    }
  });

  /**
   * POST /auth/logout
   * Invalidate refresh token
   */
  fastify.post('/logout', async (request, reply) => {
    // Validate request body
    const parseResult = refreshTokenSchema.safeParse(request.body);

    if (!parseResult.success) {
      const errors = parseResult.error.flatten().fieldErrors;
      return reply.status(400).send(errorResponse('VALIDATION_ERROR', 'Invalid input', errors));
    }

    await logoutUser(parseResult.data.refreshToken);

    return reply.send(successResponse({ message: 'Logged out successfully' }));
  });

  /**
   * POST /auth/logout-all
   * Logout from all devices (requires authentication)
   */
  fastify.post('/logout-all', { preHandler: requireAuth }, async (request, reply) => {
    await logoutAllDevices(request.user!.userId);

    return reply.send(successResponse({ message: 'Logged out from all devices' }));
  });

  /**
   * GET /auth/me
   * Get current user info (requires authentication)
   */
  fastify.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = await getUserById(request.user!.userId);

    if (!user) {
      return reply.status(404).send(errorResponse('NOT_FOUND', 'User not found'));
    }

    return reply.send(successResponse({ user }));
  });
};

export default authRoutes;
