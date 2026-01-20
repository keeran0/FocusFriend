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

  // Database (optional for now)
  DATABASE_URL: z.string().optional(),

  // JWT (optional for now)
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

// Parse and validate environment variables
const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Using process.stderr.write to avoid ESLint console warnings
    // This is appropriate for fatal startup errors
    process.stderr.write('❌ Invalid environment variables:\n');
    process.stderr.write(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2) + '\n');
    process.exit(1);
  }

  return parsed.data;
};

// Export validated environment
export const env = parseEnv();

// Type for environment variables
export type Env = z.infer<typeof envSchema>;
