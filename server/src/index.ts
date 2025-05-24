import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import timeRoutes from './routes/time.routes.js';
import ptoRoutes from './routes/pto.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/pto', ptoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    console.log('Attempting to connect to MongoDB...');
    
    // Clear any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Verify we're connected to the correct database
    const dbName = mongoose.connection?.db?.databaseName;
    console.log(`Connected to database: ${dbName}`);

    if (dbName !== 'TimeTrackerDB') {
      throw new Error('Connected to wrong database! Please check your connection string.');
    }

    console.log('Successfully connected to MongoDB.');
    
    // Create initial admin user if none exists
    await createInitialAdmin();
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

// Function to create initial admin user
async function createInitialAdmin() {
  try {
    console.log('Checking for existing admin users...');
    const User = mongoose.model('User');
    
    // First, check if the users collection exists
    const collections = await mongoose.connection?.db?.listCollections().toArray();
    const usersCollectionExists = collections?.some(col => col.name === 'users');
    
    if (!usersCollectionExists) {
      console.log('Users collection does not exist. It will be created automatically.');
    }

    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`Found ${adminCount} existing admin users.`);
    
    if (adminCount === 0) {
      console.log('Creating initial admin user...');
      const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@timetracker.com',
        password: 'admin123!@#',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Initial admin user created successfully:', {
        email: adminUser.email,
        role: adminUser.role,
        id: adminUser._id
      });
    } else {
      console.log('Admin user already exists. Skipping creation.');
    }
  } catch (error) {
    console.error('Error in createInitialAdmin:', error);
    throw error; // Rethrow to handle it in the main connection function
  }
}

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