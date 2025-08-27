import mongoose from 'mongoose';
import { MONGODB_URI } from './env.js';
import { logger } from '../shared/utils/logger.js';

let isConnected = false;

export async function connectDB(): Promise<void> {
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
}

export async function disconnectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      isConnected = false;
      logger.info('Disconnected from database');
    }
  } catch (err) {
    logger.error('MongoDB disconnection error', { error: String(err) });
  }
}
