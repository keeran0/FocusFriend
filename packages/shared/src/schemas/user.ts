/**
 * Zod validation schemas for user-related data
 */

import { z } from 'zod';
import { NudgeFrequency, ProfileVisibility } from '../types/user.js';

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email is too short')
  .max(255, 'Email is too long');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username is too long')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  displayName: z.string().min(1).max(50).optional(),
});

// Update profile schema
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

// User settings schema
export const userSettingsSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  nudgeFrequency: z.nativeEnum(NudgeFrequency).optional(),
  quietHoursStart: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  quietHoursEnd: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  defaultSessionDuration: z.number().min(5).max(180).optional(),
  idleThreshold: z.number().min(30).max(600).optional(),
  profileVisibility: z.nativeEnum(ProfileVisibility).optional(),
  showOnLeaderboard: z.boolean().optional(),
});

// Type exports from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
