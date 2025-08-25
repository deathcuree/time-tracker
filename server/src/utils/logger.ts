import pino from 'pino';

const env = process.env.NODE_ENV ?? 'development';
const level = process.env.LOG_LEVEL ?? (env === 'production' ? 'info' : 'debug');

export const logger = pino({
  level,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      '*.password',
    ],
    remove: true,
  },
  transport: env === 'production'
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: false,
          ignore: 'pid,hostname',
        },
      },
});

export function requestLogger(bindings: Record<string, unknown> = {}) {
  return logger.child(bindings);
}