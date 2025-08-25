import { Request, Response } from 'express';
import { created, error as errorResponse } from '../utils/response.js';
import { createUser as createUserService } from '../services/user.service.js';

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { email, firstName, lastName, role, position, password } = req.body as {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: 'user' | 'admin';
    position?: string;
    password?: string;
  };

  if (!email || !firstName || !lastName || !password || !role || !position) {
    errorResponse(res, 400, 'Validation error', {
      email: !email ? 'Email is required' : undefined,
      firstName: !firstName ? 'First name is required' : undefined,
      lastName: !lastName ? 'Last name is required' : undefined,
      password: !password ? 'Password is required' : undefined,
      role: !role ? 'Role is required' : undefined,
      position: !position ? 'Position is required' : undefined,
    });
    return;
  }

  try {
    const user = await createUserService({
      email,
      firstName,
      lastName,
      role,
      position,
      password,
    });

    const { password: _omit, ...userResponse } = user.toObject();
    created(res, {
      message: 'User created successfully',
      user: userResponse,
    });
  } catch (e: any) {
    if (e instanceof Error && /exists|registered|duplicate/i.test(e.message)) {
      errorResponse(res, 400, 'User with this email already exists');
      return;
    }
    errorResponse(res, 500, 'Error creating user');
  }
};