import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

export type JwtPayload = {
  userId: string;
  iat?: number;
  exp?: number;
};

export function signToken(userId: string, options?: jwt.SignOptions): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d', ...(options ?? {}) });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function tryVerifyToken(token: string): JwtPayload | null {
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}