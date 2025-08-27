import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './modules/auth/auth.routes.js';
import timeRoutes from './modules/time/time.routes.js';
import ptoRoutes from './modules/pto/pto.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import userRoutes from './modules/user/user.routes.js';

import { corsOptions } from './config/cors.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { sendError } from './shared/utils/response.js';

export function createApp(): Express {
  const app: Express = express();

  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser() as any);
  app.use(morgan('combined'));

  app.use(cors(corsOptions));

  app.use('/api/auth', authRoutes);
  app.use('/api/time', timeRoutes);
  app.use('/api/pto', ptoRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/users', userRoutes);

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use((req: Request, res: Response) => sendError(res, 404, 'Not Found'));

  app.use(errorHandler);

  return app;
}
