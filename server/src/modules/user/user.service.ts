import User from './user.model.js';

export const UserService = {
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
