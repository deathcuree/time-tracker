import { Request, Response } from 'express';
import { IUser, ILoginRequest, IRegisterRequest } from '../types/models.js';
import { validateLoginInput, validateRegistrationInput } from '../utils/validation.js';
import { AuthService } from '../services/auth.service.js';

/**
 * POST /api/auth/register
 * Validates input, delegates user creation to AuthService, sets cookie, and returns created user (sans password).
 * Express handler signature and response shape are preserved.
 */
export const register = async (
  req: Request<{}, {}, IRegisterRequest>,
  res: Response,
): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const validation = validateRegistrationInput(email, password, firstName, lastName);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
      return;
    }

    try {
      const { user, token } = await AuthService.register({ firstName, lastName, email, password });

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: (user as any)._id,
            firstName: (user as any).firstName,
            lastName: (user as any).lastName,
            name: (user as any).name,
            email: (user as any).email,
            role: (user as any).role,
          },
        },
      });
    } catch (e) {
      const err = e as any;
      if (err?.code === 'EMAIL_TAKEN') {
        res.status(400).json({
          success: false,
          message: 'Email already registered',
          errors: { email: 'This email is already registered' },
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: (error as Error).message,
    });
  }
};

/**
 * POST /api/auth/login
 * Validates input, delegates auth to AuthService, sets cookie, and returns user data.
 * Response shape preserved.
 */
export const login = async (req: Request<{}, {}, ILoginRequest>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const validation = validateLoginInput(email, password);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
      return;
    }

    try {
      const { user, token } = await AuthService.login(email, password);

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          user: {
            id: (user as any)._id,
            firstName: (user as any).firstName,
            lastName: (user as any).lastName,
            name: (user as any).name,
            email: (user as any).email,
            role: (user as any).role,
          },
        },
      });
    } catch (e) {
      const err = e as any;
      if (err?.code === 'AUTH_NO_USER') {
        res.status(401).json({
          success: false,
          message: 'Authentication failed',
          errors: { email: 'No account found with this email' },
        });
        return;
      }
      if (err?.code === 'AUTH_BAD_PASSWORD') {
        res.status(401).json({
          success: false,
          message: 'Authentication failed',
          errors: { password: 'Incorrect password' },
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: (error as Error).message,
    });
  }
};

/**
 * POST /api/auth/logout
 * Clears the auth token cookie.
 * Response preserved.
 */
export const logout = (req: Request, res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * GET /api/auth/profile
 * Returns authenticated user's profile (sans password).
 * Response preserved.
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (await AuthService.getProfile(req.user!._id.toString())) as IUser | null;
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: (error as Error).message,
    });
  }
};

/**
 * PATCH /api/auth/profile
 * Updates firstName and lastName for authenticated user.
 * Response preserved.
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'First name and last name are required',
      });
      return;
    }

    const user = (await AuthService.updateProfile(
      req.user!._id.toString(),
      firstName,
      lastName,
    )) as IUser | null;

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: (error as Error).message,
    });
  }
};

/**
 * PATCH /api/auth/password
 * Updates authenticated user's password after verifying current password.
 * Response preserved.
 */
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
      return;
    }

    try {
      await AuthService.updatePassword(req.user!._id.toString(), currentPassword, newPassword);
      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (e) {
      const err = e as any;
      if (err?.code === 'USER_NOT_FOUND') {
        res.status(500).json({
          success: false,
          message: 'Server error while updating password',
          error: 'User not found',
        });
        return;
      }
      if (err?.code === 'BAD_CURRENT_PASSWORD') {
        res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating password',
      error: (error as Error).message,
    });
  }
};

/**
 * POST /api/auth/validate-password
 * Validates that the provided password matches the current password.
 * Response preserved.
 */
export const validateCurrentPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password is required',
      });
      return;
    }

    try {
      const isMatch = await AuthService.validateCurrentPassword(req.user!._id.toString(), password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Password is valid',
      });
    } catch (e) {
      const err = e as any;
      if (err?.code === 'USER_NOT_FOUND') {
        res.status(500).json({
          success: false,
          message: 'Server error while validating password',
          error: 'User not found',
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while validating password',
      error: (error as Error).message,
    });
  }
};
