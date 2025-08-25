import { CookieOptions } from 'express';

type Mode = 'production' | 'development' | 'test';

const isProd = (process.env.NODE_ENV ?? 'development') === 'production';

export function getAuthCookieOptions(overrides: Partial<CookieOptions> = {}): CookieOptions {
  const base: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  return { ...base, ...overrides };
}

export function computeSameSite(): NonNullable<CookieOptions['sameSite']> {
  return isProd ? 'none' : 'lax';
}

export function getCookieOptions(overrides: Partial<CookieOptions> = {}): CookieOptions {
  const base: CookieOptions = {
    secure: isProd,
    sameSite: computeSameSite(),
    path: '/',
  };
  return { ...base, ...overrides };
}