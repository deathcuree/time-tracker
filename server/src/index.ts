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
import http from 'http';
import { validateEnv } from './utils/validateEnv.js';

validateEnv();

const app: Express = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI as string;
const CORS_ORIGIN = process.env.CORS_ORIGIN as string;

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser() as any);
app.use(morgan('combined'));

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

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'TimeTrackerDB',
      autoCreate: true 
    });
    const dbName = mongoose.connection?.db?.databaseName;
    console.log(`Connected to database: ${dbName}`);
    if (dbName !== 'TimeTrackerDB') {
      throw new Error('Connected to wrong database! Please check your connection string.');
    }
    console.log('Successfully connected to MongoDB.');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const server = http.createServer(app);
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await mongoose.disconnect();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer(); 