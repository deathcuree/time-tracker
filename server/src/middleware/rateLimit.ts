import rateLimit from 'express-rate-limit';

const env = process.env.NODE_ENV;

export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
  },
  skipSuccessfulRequests: true,
});

export const sensitiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});