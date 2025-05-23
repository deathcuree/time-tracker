import { axiosInstance } from '../axios';
import * as z from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['user', 'admin']),
  position: z.string().min(2, 'Position must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type CreateUserData = z.infer<typeof createUserSchema>;

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  position: string;
  createdAt: string;
  updatedAt: string;
}

export const usersApi = {
  createUser: async (data: CreateUserData): Promise<User> => {
    console.log('Creating user:', { ...data, password: '[REDACTED]' });
    const response = await axiosInstance.post<{ user: User }>('/users', data);
    console.log('Create user response:', response.data);
    return response.data.user;
  },
}; 