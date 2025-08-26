import { Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service.js';
import { createUserSchema } from '../validators/user.validator.js';

/**
 * POST /api/users
 * Creates a user.
 * - Keeps the same Express handler signature and response shape.
 * - Validates body with zod (unchanged).
 * - Delegates DB operations to UserService.
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    try {
      const userResponse = await UserService.createUser({
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: validatedData.password,
        role: validatedData.role,
        position: validatedData.position,
      });

      res.status(201).json({
        message: 'User created successfully',
        user: userResponse,
      });
    } catch (e) {
      const err = e as any;
      if (typeof err?.status === 'number') {
        if (err.status === 400 && /exists/i.test(err.message)) {
          return res.status(400).json({ message: 'User with this email already exists' });
        }
        return res.status(err.status).json({ message: err.message });
      }
      throw err;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      });
    }

    res.status(500).json({ message: 'Error creating user' });
  }
};
