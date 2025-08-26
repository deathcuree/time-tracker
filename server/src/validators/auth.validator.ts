import { z } from 'zod';

const email = z.string().email('Please enter a valid email');
const firstName = z.string().trim().min(1, 'First name is required');
const lastName = z.string().trim().min(1, 'Last name is required');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  firstName,
  lastName,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
});

export const validatePasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName,
  lastName,
  email,
  password,
});

export type LoginDto = z.infer<typeof loginSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;
export type ValidatePasswordDto = z.infer<typeof validatePasswordSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
