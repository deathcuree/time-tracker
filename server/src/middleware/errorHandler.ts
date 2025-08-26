import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const isProd = process.env.NODE_ENV === 'production';

  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: Record<string, unknown> | string | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode || 500;
    message = err.message || message;
    details = err.details;
  } else if (err && typeof err === 'object') {
    const e = err as any;
    statusCode =
      typeof e.statusCode === 'number'
        ? e.statusCode
        : typeof e.status === 'number'
        ? e.status
        : 500;
    message = typeof e.message === 'string' ? e.message : message;
    details = e.details;
  }

  const stack = (err as any)?.stack as string | undefined;
  logger.error(message, {
    statusCode,
    details,
    stack,
  });

  if (isProd && statusCode === 500) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
  });
}
