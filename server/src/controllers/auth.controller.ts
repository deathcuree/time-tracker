import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { IUser, ILoginRequest, IRegisterRequest } from '../types/models.js';
import { validateLoginInput, validateRegistrationInput } from '../utils/validation.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT secret is configured
if (!JWT_SECRET) {
  console.error('JWT_SECRET is not configured in environment variables!');
  process.exit(1);
}

const generateToken = (userId: string): string => {
  try {
    console.log('Generating token for user ID:', userId);
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

export const register = async (req: Request<{}, {}, IRegisterRequest>, res: Response): Promise<void> => {
  try {
    console.log('Registration attempt with email:', req.body.email);
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
      console.log('Registration failed: Email already exists:', email);
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
    console.log('New user created successfully:', { email, role: user.role });

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        token,
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
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: (error as Error).message 
    });
  }
};

export const login = async (req: Request<{}, {}, ILoginRequest>, res: Response): Promise<void> => {
  try {
    console.log('Login attempt with email:', req.body.email);
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
      console.log('Login failed: User not found with email:', email);
      res.status(401).json({ 
        success: false,
        message: 'Authentication failed',
        errors: {
          email: 'No account found with this email'
        }
      });
      return;
    }
    console.log('User found:', { email: user.email, role: user.role });

    // Check password
    console.log('Verifying password...');
    const isMatch = await user.comparePassword(password);
    console.log('Password verification result:', isMatch);
    
    if (!isMatch) {
      console.log('Login failed: Invalid password for email:', email);
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

    console.log('Login successful for user:', { email: user.email, role: user.role });
    res.json({
      success: true,
      data: {
        token,
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
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: (error as Error).message 
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching profile for user ID:', req.user!._id);
    const user = await User.findById(req.user!._id).select('-password') as IUser | null;
    if (!user) {
      console.log('Profile fetch failed: User not found with ID:', req.user!._id);
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
      return;
    }
    console.log('Profile fetched successfully for:', { email: user.email, role: user.role });
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching profile',
      error: (error as Error).message 
    });
  }
}; 