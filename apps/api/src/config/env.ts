import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file
config();

// Define the schema for environment variables
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('localhost'),

  // API
  API_PREFIX: z.string().default('/api/v1'),

  // CORS
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform(val => val.split(',')),

  // Database - NOW REQUIRED
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

// Parse and validate environment variables
const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
};

// Export validated environment
export const env = parseEnv();

// Type for environment variables
export type Env = z.infer<typeof envSchema>;
