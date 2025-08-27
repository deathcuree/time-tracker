type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levelOrder: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function getEnvLevel(): LogLevel {
  const fallback: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  const lvl = (process.env.LOG_LEVEL || fallback).toLowerCase();
  if (lvl === 'error' || lvl === 'warn' || lvl === 'info' || lvl === 'debug') {
    return lvl;
  }
  return fallback;
}

const currentLevel: LogLevel = getEnvLevel();

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] <= levelOrder[currentLevel];
}

function baseFields(extra?: Record<string, unknown>) {
  return {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    ...extra,
  };
}

export const logger = {
  error(message: string, meta?: Record<string, unknown>) {
    if (!shouldLog('error')) return;
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ level: 'error', msg: message, ...baseFields(meta) }));
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (!shouldLog('warn')) return;
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify({ level: 'warn', msg: message, ...baseFields(meta) }));
  },
  info(message: string, meta?: Record<string, unknown>) {
    if (!shouldLog('info')) return;
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ level: 'info', msg: message, ...baseFields(meta) }));
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (!shouldLog('debug')) return;
    // eslint-disable-next-line no-console
    console.debug(JSON.stringify({ level: 'debug', msg: message, ...baseFields(meta) }));
  },
};
