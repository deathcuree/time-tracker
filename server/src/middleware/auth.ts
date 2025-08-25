import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import { tryVerifyToken } from '../utils/jwt.js';
import { error as errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.token;
  if (!token) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }

  const payload = tryVerifyToken(token);
  if (!payload?.userId) {
    errorResponse(res, 401, 'Invalid token');
    return;
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    errorResponse(res, 401, 'User not found');
    return;
  }

  req.user = user;
  return next();
};

export const isAdmin = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const req = _req as Request;
    if (req.user?.role !== 'admin') {
      errorResponse(res, 403, 'Admin access required');
      return;
    }
    return next();
  } catch (err) {
    logger.error({ err }, 'isAdmin middleware error');
    errorResponse(res, 500, 'Server error');
  }
};