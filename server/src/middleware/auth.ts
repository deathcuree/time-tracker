import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { IUser } from '../types/models.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT secret is configured
if (!JWT_SECRET) {
  process.exit(1);
}

interface JwtPayload {
  userId: string;
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 