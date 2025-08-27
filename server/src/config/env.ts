import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.string().optional(),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  NODE_ENV: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables');
}

const env = parsed.data;

export const PORT: number = Number(env.PORT ?? '3000');
export const MONGODB_URI: string = env.MONGODB_URI;

export const CORS_ORIGIN: string = env.CORS_ORIGIN;

export const NODE_ENV = env.NODE_ENV;
export const IS_PROD = NODE_ENV === 'production';
