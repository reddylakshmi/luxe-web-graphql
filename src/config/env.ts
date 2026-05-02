import * as dotenv from 'dotenv';
import * as path from 'path';
import { z } from 'zod';

const root = path.resolve(process.cwd());

/**
 * Loading order (later entries override earlier ones, matching Next.js convention):
 *   1. .env                  — base defaults for all environments
 *   2. .env.{APP_ENV}        — environment-specific values (dev/test/staging/production)
 *   3. .env.local            — local developer overrides (gitignored, never committed)
 *
 * APP_ENV takes priority over NODE_ENV for selecting the env file so that
 * staging can run with NODE_ENV=production while still loading .env.staging.
 */
dotenv.config({ path: path.join(root, '.env') });

const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development';
dotenv.config({ path: path.join(root, `.env.${appEnv}`), override: true });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),

  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Non-standard environments: staging, qa, etc.
  APP_ENV: z.string().default('development'),

  // Comma-separated list of allowed CORS origins
  CORS_ORIGINS: z
    .string()
    .default(
      'http://localhost:3000,http://localhost:3001,http://localhost:4000,https://studio.apollographql.com'
    ),

  // Java REST API base URL — leave empty until the real backend is available.
  // Resolvers check this and fall back to mock data when unset.
  JAVA_API_URL: z.string().url().optional(),

  // Bearer token / API key for authenticating with the Java REST API
  JAVA_API_KEY: z.string().optional(),

  // JWT signing secret used in mock mode.
  // In production Okta signs tokens with RS256; this secret is never used then.
  MOCK_JWT_SECRET: z.string().default('mock-jwt-secret-dev-only-change-in-production'),

  // How long issued tokens stay valid (seconds). Default: 1 hour, matching Okta default.
  JWT_EXPIRY_SECONDS: z.coerce.number().int().positive().default(3600),
});

export type Env = z.infer<typeof EnvSchema>;

export const config = EnvSchema.parse(process.env);

/** Parsed list of allowed CORS origins */
export const CORS_ORIGIN_LIST: string[] = config.CORS_ORIGINS
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
