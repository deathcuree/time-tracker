import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User.js';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['user', 'admin']),
  position: z.string().min(2, 'Position must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createUser = async (req: Request, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = new User({
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      password: validatedData.password,
      role: validatedData.role,
      position: validatedData.position,
    });

    await user.save();

    const { password: _, ...userResponse } = user.toObject();

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: 'Error creating user' });
  }
}; 