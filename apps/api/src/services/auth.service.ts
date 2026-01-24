/**
 * Authentication service - handles user registration, login, and token management
 */

import { prisma } from '../lib/prisma.js';
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyAccessToken,
  getRefreshTokenExpiry,
} from '../utils/auth.js';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthTokens,
  JwtPayload,
} from '../types/auth.js';

// Error types for auth operations
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  const { email, username, password, displayName } = data;

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new AuthError('Email already registered', 'EMAIL_EXISTS', 409);
  }

  // Check if username already exists
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    throw new AuthError('Username already taken', 'USERNAME_EXISTS', 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user with default settings
  const user = await prisma.user.create({
    data: {
      email,
      username,
      displayName: displayName || username,
      password: hashedPassword,
      settings: {
        create: {
          notificationsEnabled: true,
          nudgeFrequency: 'MODERATE',
          defaultSessionDuration: 25,
          idleThreshold: 120,
          profileVisibility: 'FRIENDS_ONLY',
          showOnLeaderboard: true,
        },
      },
    },
  });

  // Generate tokens
  const tokenPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
  };

  const tokens = generateTokens(tokenPayload);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
    tokens,
  };
}

/**
 * Login an existing user
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const { email, password } = data;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const tokenPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
  };

  const tokens = generateTokens(tokenPayload);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
    tokens,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  // Find refresh token in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw new AuthError('Refresh token expired', 'TOKEN_EXPIRED');
  }

  const user = storedToken.user;

  // Generate new tokens (token rotation for security)
  const tokenPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
  };

  const newTokens = generateTokens(tokenPayload);

  // Delete old refresh token and create new one (rotation)
  await prisma.$transaction([
    prisma.refreshToken.delete({
      where: { id: storedToken.id },
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newTokens.refreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    }),
  ]);

  return newTokens;
}

/**
 * Logout user by invalidating refresh token
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  // Delete the refresh token (ignore if not found)
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}

/**
 * Logout user from all devices
 */
export async function logoutAllDevices(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

/**
 * Validate access token and return user info
 */
export async function validateAccessToken(token: string): Promise<JwtPayload | null> {
  const payload = verifyAccessToken(token);

  if (!payload) {
    return null;
  }

  // Optionally verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true },
  });

  if (!user) {
    return null;
  }

  return payload;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
}
