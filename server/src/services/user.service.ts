import User from '../models/User.js';
import { IUser } from '../types/models.js';

export type CreateUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  position: string;
  password: string;
};

export async function createUser(input: CreateUserInput): Promise<IUser> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new Error('User with this email already exists');
  }
  const user = new User({
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    password: input.password,
    role: input.role,
    position: input.position,
  }) as IUser;

  await user.save();
  return user;
}