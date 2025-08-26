import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodTypeAny } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * validateRequest
 * Use Zod schemas to validate req.body / req.params / req.query
 * On failure, forwards a standardized ValidationError to the global handler.
 */
export function validateRequest(schemas: {
  body?: AnyZodObject | ZodTypeAny;
  params?: AnyZodObject | ZodTypeAny;
  query?: AnyZodObject | ZodTypeAny;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const errors: Record<string, unknown> = {};

      if (schemas.body) {
        try {
          const parsed = schemas.body.parse(req.body);
          (req as any).body = parsed;
        } catch (e) {
          const ze = e as ZodError;
          errors.body = ze.flatten();
        }
      }

      if (schemas.params) {
        try {
          const parsed = schemas.params.parse(req.params);
          (req as any).params = parsed;
        } catch (e) {
          const ze = e as ZodError;
          errors.params = ze.flatten();
        }
      }

      if (schemas.query) {
        try {
          const parsed = schemas.query.parse(req.query);
          (req as any).query = parsed;
        } catch (e) {
          const ze = e as ZodError;
          errors.query = ze.flatten();
        }
      }

      if (Object.keys(errors).length > 0) {
        return next(new ValidationError('Validation failed', errors));
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
