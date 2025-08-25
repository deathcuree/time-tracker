import User from '../models/User.js';

/**
 * UserService
 * Encapsulates user management business logic (DB operations and transformations).
 * Controllers remain responsible for validation and Express req/res handling.
 */
export const UserService = {
  /**
   * Create a user using already validated payload.
   * Returns the user object without password field.
   */
  createUser: async (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: 'user' | 'admin';
    position: string;
  }) => {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      const err: any = new Error('User with this email already exists');
      err.status = 400;
      throw err;
    }

    const user = new User({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      role: data.role,
      position: data.position,
    });

    await user.save();

    const { password: _pw, ...userResponse } = user.toObject();
    return userResponse;
  },
};
