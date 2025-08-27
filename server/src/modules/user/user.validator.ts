import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['user', 'admin']),
  position: z.string().min(2, 'Position must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

export const updateRoleParamsSchema = z.object({
  userId: z.string().trim().min(1, 'userId is required'),
});
