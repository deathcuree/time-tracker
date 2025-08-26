import { Response } from 'express';
import type { CookieOptions } from 'express';

/**
 * Standard success response helper
 * Shape preserved: { success: true, data, message? }
 */
export function sendSuccess<T = unknown>(res: Response, data: T, message?: string) {
  return res.json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
}

/**
 * Standard error response helper
 * Shape preserved: { success: false, message, errors? }
 */
export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: Record<string, unknown> | string,
) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

/**
 * Get environment-aware cookie options for auth token
 * - Production: secure, none
 * - Development: not secure, lax
 */
export function getCookieOptions(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: maxAgeMs,
  };
}

/**
 * Set consistent XLSX export headers
 */
export function setExportHeaders(res: Response, filename: string) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Transfer-Encoding', 'binary');
  res.setHeader('Cache-Control', 'no-store, no-transform');
  res.setHeader('Pragma', 'no-cache');
}
