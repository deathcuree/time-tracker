import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { IUser, ILoginRequest, IRegisterRequest } from '../types/models.js';
import { validateLoginInput, validateRegistrationInput } from '../utils/validation.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  process.exit(1);
}

const generateToken = (userId: string): string => {
  try {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    return token;
  } catch (error) {
    throw new Error('Failed to generate authentication token');
  }
};

export const register = async (req: Request<{}, {}, IRegisterRequest>, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate input
    const validation = validateRegistrationInput(email, password, firstName, lastName);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ 
        success: false,
        message: 'Email already registered',
        errors: {
          email: 'This email is already registered'
        }
      });
      return;
    }

    // Create new user (role will default to 'user')
    const user = new User({
      firstName,
      lastName,
      email,
      password
    }) as IUser;

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: (error as Error).message 
    });
  }
};

export const login = async (req: Request<{}, {}, ILoginRequest>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateLoginInput(email, password);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
      return;
    }

    // Find user
    const user = await User.findOne({ email }) as IUser | null;
    if (!user) {
      res.status(401).json({ 
        success: false,
        message: 'Authentication failed',
        errors: {
          email: 'No account found with this email'
        }
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      res.status(401).json({ 
        success: false,
        message: 'Authentication failed',
        errors: {
          password: 'Incorrect password'
        }
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: (error as Error).message 
    });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('-password') as IUser | null;
    if (!user) {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
      return;
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching profile',
      error: (error as Error).message 
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName } = req.body;
    
    // Validate input
    if (!firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
      return;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { firstName, lastName },
      { new: true }
    ).select('-password') as IUser | null;

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: (error as Error).message
    });
  }
};

export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
      return;
    }

    // Find user with password
    const user = await User.findById(req.user!._id) as IUser;
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save(); // This will trigger the pre-save hook to hash the password

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating password',
      error: (error as Error).message
    });
  }
};

export const validateCurrentPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    
    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password is required'
      });
      return;
    }

    // Find user with password
    const user = await User.findById(req.user!._id) as IUser;
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Password is valid'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while validating password',
      error: (error as Error).message
    });
  }
}; 