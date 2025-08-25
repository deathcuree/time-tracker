import { Request, Response } from 'express';
import { created, success, error as errorResponse } from '../utils/response.js';
import { signToken } from '../utils/jwt.js';
import { getAuthCookieOptions, getCookieOptions } from '../utils/cookies.js';
import {
  authenticateUser,
  registerUser,
  getUserProfile as getUserProfileService,
  updateUserProfile as updateUserProfileService,
  updateUserPassword as updateUserPasswordService,
  validatePassword as validatePasswordService,
} from '../services/auth.service.js';
import { ILoginRequest, IRegisterRequest } from '../types/models.js';
import { validateLoginInput, validateRegistrationInput } from '../utils/validation.js';
import { serializeUser } from '../utils/serializer.js';

export const register = async (
  req: Request<{}, {}, IRegisterRequest>,
  res: Response,
): Promise<void> => {
  const { firstName, lastName, email, password } = req.body;

  const validation = validateRegistrationInput(email, password, firstName, lastName);
  if (!validation.success) {
    errorResponse(res, 400, 'Validation failed', validation.errors);
    return;
  }

  const user = await registerUser({ firstName, lastName, email, password });

  const token = signToken(user._id.toString());
  res.cookie('token', token, getAuthCookieOptions());

  created(res, {
    user: serializeUser(user),
  });
};

export const login = async (req: Request<{}, {}, ILoginRequest>, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const validation = validateLoginInput(email, password);
  if (!validation.success) {
    errorResponse(res, 400, 'Validation failed', validation.errors);
    return;
  }

  const user = await authenticateUser({ email, password });

  const token = signToken(user._id.toString());
  res.cookie('token', token, getAuthCookieOptions());

  success(res, {
    user: serializeUser(user),
  });
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('token', getCookieOptions({ httpOnly: true }));
  success(res, { message: 'Logged out successfully' });
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }

  const user = await getUserProfileService(userId);
  if (!user) {
    errorResponse(res, 404, 'User not found');
    return;
  }
  success(res, { user: serializeUser(user) });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }

  const { firstName, lastName } = req.body as { firstName?: string; lastName?: string };
  if (!firstName || !lastName) {
    errorResponse(res, 400, 'First name and last name are required');
    return;
  }

  const user = await updateUserProfileService(userId, { firstName, lastName });

  if (!user) {
    errorResponse(res, 404, 'User not found');
    return;
  }

  success(res, { user: serializeUser(user) });
};

export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    errorResponse(res, 400, 'Current password and new password are required');
    return;
  }

  await updateUserPasswordService(userId, currentPassword, newPassword);

  success(res, { message: 'Password updated successfully' });
};

export const validateCurrentPassword = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }

  const { password } = req.body as { password?: string };

  if (!password) {
    errorResponse(res, 400, 'Password is required');
    return;
  }

  const ok = await validatePasswordService(userId, password);

  if (!ok) {
    errorResponse(res, 401, 'Current password is incorrect');
    return;
  }

  success(res, { message: 'Password is valid' });
};
