/**
 * Zod validation schemas for session-related data
 */

import { z } from 'zod';

// Start session schema
export const startSessionSchema = z.object({
  plannedDuration: z
    .number()
    .min(300, 'Session must be at least 5 minutes')
    .max(14400, 'Session cannot exceed 4 hours'),
  tags: z.array(z.string().max(50)).max(5).optional(),
  note: z.string().max(500).optional(),
});

// End session schema
export const endSessionSchema = z.object({
  note: z.string().max(500).optional(),
});

// Update session schema
export const updateSessionSchema = z.object({
  tags: z.array(z.string().max(50)).max(5).optional(),
  note: z.string().max(500).optional(),
});

// Query sessions schema
export const querySessionsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['active', 'completed', 'abandoned']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Type exports
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type EndSessionInput = z.infer<typeof endSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type QuerySessionsInput = z.infer<typeof querySessionsSchema>;
