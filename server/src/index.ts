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

validateEnv();

const app: Express = express();
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI as string;
const CORS_ORIGIN = process.env.CORS_ORIGIN as string;

app.use(helmet());
app.use(express.json());
app.use(cookieParser() as any);
app.use(morgan('combined'));

// Proper CORS with credentials and exposed headers for downloads
app.use(cors({
  origin: (CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean),
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
}));
app.use('/api/auth', authRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/pto', ptoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use((req: Request, res: Response) => res.status(404).json({ message: 'Not Found' }));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
});

let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    const dbName = mongoose.connection?.db?.databaseName;
    console.log(`Connected to database: ${dbName}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();
  // Ensure binary responses (e.g., Excel .xlsx) are encoded correctly through API Gateway
  const serverlessHandler = serverless(app, {
    binary: [
      'application/octet-stream',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  });
  return serverlessHandler(event, context);
};

if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running locally on port ${PORT}`);
    });
  });
}

export { handler }; 