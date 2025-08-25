import { Response } from 'express';

export type ApiSuccess<T = unknown> = {
  success: true;
  data?: T;
  message?: string;
};

export type ApiError = {
  success: false;
  message: string;
  errors?: Record<string, unknown> | unknown;
};

export function success<T = unknown>(res: Response, data?: T, status = 200, message?: string): Response {
  const body: ApiSuccess<T> = { success: true };
  if (typeof data !== 'undefined') body.data = data;
  if (message) body.message = message;
  return res.status(status).json(body);
}

export function created<T = unknown>(res: Response, data?: T, message?: string): Response {
  return success(res, data, 201, message);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function error(res: Response, status = 500, message = 'Internal Server Error', errors?: ApiError['errors']): Response {
  const body: ApiError = { success: false, message };
  if (typeof errors !== 'undefined') body.errors = errors;
  return res.status(status).json(body);
}