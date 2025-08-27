import type { CorsOptions } from 'cors';
import { CORS_ORIGIN } from './env.js';

export const corsOptions: CorsOptions = {
  origin: CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
};
