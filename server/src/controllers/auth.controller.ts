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

    const validation = validateRegistrationInput(email, password, firstName, lastName);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
      return;
    }

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

    const user = new User({
      firstName,
      lastName,
      email,
      password
    }) as IUser;

    await user.save();

    const token = generateToken(user._id.toString());
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
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

    const validation = validateLoginInput(email, password);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
      return;
    }

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

    const token = generateToken(user._id.toString());
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
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
    secure: true,
    sameSite: 'none',
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
    
    if (!firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
      return;
    }

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
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
      return;
    }

    const user = await User.findById(req.user!._id) as IUser;
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    user.password = newPassword;
    await user.save();

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

    const user = await User.findById(req.user!._id) as IUser;
    
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