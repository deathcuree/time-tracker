import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import timeRoutes from './routes/time.routes.js';
import ptoRoutes from './routes/pto.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import serverless from 'serverless-http';
import { validateEnv } from './utils/validateEnv.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendError } from './utils/response.js';
import { logger } from './utils/logger.js';

validateEnv();

const app: Express = express();
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI as string;
const CORS_ORIGIN = process.env.CORS_ORIGIN as string;

app.use(helmet());
app.use(express.json());
app.use(cookieParser() as any);
app.use(morgan('combined'));

app.use(
  cors({
    origin: CORS_ORIGIN.split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  }),
);
app.use('/api/auth', authRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/pto', ptoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use((req: Request, res: Response) => sendError(res, 404, 'Not Found'));

app.use(errorHandler);

let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    const dbName = mongoose.connection?.db?.databaseName;
    logger.info('Connected to database', { dbName });
  } catch (err) {
    logger.error('MongoDB connection error', { error: String(err) });
    throw err;
  }
};

const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();
  const serverlessHandler = serverless(app, {
    binary: [
      'application/octet-stream',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  });
  return serverlessHandler(event, context);
};

if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running locally on port ${PORT}`);
    });
  });
}

export { handler };
