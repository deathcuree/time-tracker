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

const app: Express = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // or your frontend's URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser() as any);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/pto', ptoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI as string;
    console.log('Attempting to connect to MongoDB...');
    
    // Clear any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(mongoURI, {
      dbName: 'TimeTrackerDB',
      autoCreate: true 
    });

    // Verify we're connected to the correct database
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

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT;

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Initialize the server
startServer(); 