import User from '../models/User.js';
import { IUser } from '../types/models.js';

export const UserManagementService = {
  /**
   * Update a user's role and return the updated safe user (without password)
   */
  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<IUser | null> {
    const user = (await User.findByIdAndUpdate(userId, { role }, { new: true }).select(
      '-password',
    )) as IUser | null;
    return user;
  },
};
