import jwt from 'jsonwebtoken';
import User from '../user/user.model.js';
import { IUser, IRegisterRequest } from '../../types/models.js';

export const AuthService = {
  generateToken: (userId: string, role: 'user' | 'admin'): string => {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT secret not configured');
    }
    try {
      return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '7d' });
    } catch {
      throw new Error('Failed to generate authentication token');
    }
  },

  register: async (
    data: IRegisterRequest,
  ): Promise<{
    user: Omit<IUser, 'password'> | any;
    token: string;
  }> => {
    const { firstName, lastName, email, password } = data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err: any = new Error('Email already registered');
      err.code = 'EMAIL_TAKEN';
      throw err;
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
    }) as IUser;

    await user.save();

    const token = AuthService.generateToken(user._id.toString(), (user as IUser).role);
    const safe = await User.findById(user._id).select('-password');
    return { user: safe, token };
  },

  login: async (
    email: string,
    password: string,
  ): Promise<{
    user: Omit<IUser, 'password'> | any;
    token: string;
  }> => {
    const user = (await User.findOne({ email })) as IUser | null;
    if (!user) {
      const err: any = new Error('Authentication failed: user not found');
      err.code = 'AUTH_NO_USER';
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err: any = new Error('Authentication failed: incorrect password');
      err.code = 'AUTH_BAD_PASSWORD';
      throw err;
    }

    const token = AuthService.generateToken(user._id.toString(), (user as IUser).role);
    const safe = await User.findById(user._id).select('-password');
    return { user: safe, token };
  },

  getProfile: async (userId: string) => {
    const user = await User.findById(userId).select('-password');
    return user;
  },

  updateProfile: async (userId: string, firstName: string, lastName: string) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName },
      { new: true },
    ).select('-password');
    return user;
  },

  updatePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    const user = (await User.findById(userId)) as IUser | null;
    if (!user) {
      const err: any = new Error('User not found');
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const err: any = new Error('Current password is incorrect');
      err.code = 'BAD_CURRENT_PASSWORD';
      throw err;
    }

    user.password = newPassword;
    await user.save();
  },

  validateCurrentPassword: async (userId: string, password: string): Promise<boolean> => {
    const user = (await User.findById(userId)) as IUser | null;
    if (!user) {
      const err: any = new Error('User not found');
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    return user.comparePassword(password);
  },
};
