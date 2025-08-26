export type ErrorDetails = Record<string, unknown> | string | undefined;

export class AppError extends Error {
  public statusCode: number;
  public details?: ErrorDetails;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, details?: ErrorDetails, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ErrorDetails) {
    super(message, 400, details);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication failed', details?: ErrorDetails) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: ErrorDetails) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: ErrorDetails) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: ErrorDetails) {
    super(message, 409, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: ErrorDetails) {
    super(message, 400, details);
  }
}
