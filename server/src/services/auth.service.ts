import User from '../models/User.js';
import { IUser } from '../types/models.js';

export async function registerUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<IUser> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new Error('Email already registered');
  }
  const user = new User({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
  }) as IUser;

  await user.save();
  return user;
}

export async function authenticateUser(input: { email: string; password: string }): Promise<IUser> {
  const user = (await User.findOne({ email: input.email })) as IUser | null;
  if (!user) {
    throw new Error('User not found.');
  }
  const ok = await user.comparePassword(input.password);
  if (!ok) {
    throw new Error('Invalid password.');
  }
  const safeUser = (await User.findById(user._id).select('-password')) as IUser | null;
  if (!safeUser) {
    throw new Error('User not found.');
  }
  return safeUser;
}

export async function getUserProfile(userId: string): Promise<IUser | null> {
  return User.findById(userId).select('-password') as Promise<IUser | null>;
}

export async function updateUserProfile(
  userId: string,
  input: { firstName: string; lastName: string },
): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    { firstName: input.firstName, lastName: input.lastName },
    { new: true },
  ).select('-password') as Promise<IUser | null>;
}

export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = (await User.findById(userId)) as IUser | null;
  if (!user) {
    throw new Error('User not found');
  }
  const ok = await user.comparePassword(currentPassword);
  if (!ok) {
    throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
}

export async function validatePassword(userId: string, password: string): Promise<boolean> {
  const user = (await User.findById(userId)) as IUser | null;
  if (!user) {
    throw new Error('User not found');
  }
  return user.comparePassword(password);
}
