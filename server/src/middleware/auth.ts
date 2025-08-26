import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AuthError, ForbiddenError } from '../utils/errors.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Fail fast if misconfigured
  process.exit(1);
}

interface JwtPayload {
  sub: string; // user id
  role?: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export const auth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.token as string | undefined;

    if (!token) {
      return next(new AuthError('Authentication required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const userId = decoded.sub || (decoded as any).userId; // backward-compatibility
    if (!userId) {
      return next(new AuthError('Invalid token'));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AuthError('User not found'));
    }

    req.user = user;
    return next();
  } catch {
    return next(new AuthError('Invalid token'));
  }
};

export const isAdmin = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      return next(new ForbiddenError('Admin access required'));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
