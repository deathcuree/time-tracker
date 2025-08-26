import { Request, Response, NextFunction } from 'express';
import { IUser, ILoginRequest, IRegisterRequest } from '../types/models.js';
import { AuthService } from '../services/auth.service.js';
import { sendSuccess, sendError, getCookieOptions } from '../utils/response.js';

/**
 * POST /api/auth/register
 * Validates input (handled by Zod in routes), delegates to AuthService, sets cookie, returns safe user.
 * Response shape preserved.
 */
export const register = async (
  req: Request<{}, {}, IRegisterRequest>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    try {
      const { user, token } = await AuthService.register({ firstName, lastName, email, password });

      res.cookie('token', token, getCookieOptions());

      // Preserve original success shape
      return sendSuccess(res, {
        user: {
          id: (user as any)._id,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          name: (user as any).name,
          email: (user as any).email,
          role: (user as any).role,
        },
      });
    } catch (e) {
      const err = e as any;
      if (err?.code === 'EMAIL_TAKEN') {
        return sendError(res, 400, 'Email already registered', {
          email: 'This email is already registered',
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Validates input (Zod via route), delegates to AuthService, sets cookie, returns safe user.
 * Response shape preserved.
 */
export const login = async (
  req: Request<{}, {}, ILoginRequest>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    try {
      const { user, token } = await AuthService.login(email, password);

      res.cookie('token', token, getCookieOptions());

      return sendSuccess(res, {
        user: {
          id: (user as any)._id,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          name: (user as any).name,
          email: (user as any).email,
          role: (user as any).role,
        },
      });
    } catch (e) {
      const err = e as any;
      if (err?.code === 'AUTH_NO_USER') {
        return sendError(res, 401, 'Authentication failed', {
          email: 'No account found with this email',
        });
      }
      if (err?.code === 'AUTH_BAD_PASSWORD') {
        return sendError(res, 401, 'Authentication failed', { password: 'Incorrect password' });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clears the auth token cookie.
 * Response preserved.
 */
export const logout = (_req: Request, res: Response): void => {
  // Match cookie attributes to ensure proper clearing
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * GET /api/auth/profile
 * Returns authenticated user's profile (sans password).
 * Response preserved.
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const user = (await AuthService.getProfile(req.user!._id.toString())) as IUser | null;
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/profile
 * Updates firstName and lastName for authenticated user.
 * Response preserved.
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { firstName, lastName } = req.body as { firstName: string; lastName: string };

    const user = (await AuthService.updateProfile(
      req.user!._id.toString(),
      firstName,
      lastName,
    )) as IUser | null;

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/password
 * Updates authenticated user's password after verifying current password.
 * Response preserved.
 */
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    try {
      await AuthService.updatePassword(req.user!._id.toString(), currentPassword, newPassword);
      return sendSuccess(res, null, 'Password updated successfully');
    } catch (e) {
      const err = e as any;
      if (err?.code === 'USER_NOT_FOUND') {
        return sendError(res, 500, 'Server error while updating password', 'User not found');
      }
      if (err?.code === 'BAD_CURRENT_PASSWORD') {
        return sendError(res, 401, 'Current password is incorrect');
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/validate-password
 * Validates that the provided password matches the current password.
 * Response preserved.
 */
export const validateCurrentPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const { password } = req.body as { password: string };

    try {
      const isMatch = await AuthService.validateCurrentPassword(req.user!._id.toString(), password);
      if (!isMatch) {
        return sendError(res, 401, 'Current password is incorrect');
      }
      return sendSuccess(res, null, 'Password is valid');
    } catch (e) {
      const err = e as any;
      if (err?.code === 'USER_NOT_FOUND') {
        return sendError(res, 500, 'Server error while validating password', 'User not found');
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};
