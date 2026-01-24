/**
 * Authentication middleware
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { extractBearerToken } from '../utils/auth.js';
import { validateAccessToken } from '../services/auth.service.js';
import type { AuthenticatedUser } from '../types/auth.js';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Middleware to require authentication
 * Verifies JWT token and attaches user to request
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = extractBearerToken(request.headers.authorization);

  if (!token) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  const payload = await validateAccessToken(token);

  if (!payload) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }

  // Attach user to request
  request.user = {
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
  };
}

/**
 * Optional auth middleware - doesn't fail if no token
 * Useful for routes that work differently for logged-in users
 */
export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const token = extractBearerToken(request.headers.authorization);

  if (!token) {
    return; // Continue without user
  }

  const payload = await validateAccessToken(token);

  if (payload) {
    request.user = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
    };
  }
}
