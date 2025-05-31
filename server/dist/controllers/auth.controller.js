import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateLoginInput, validateRegistrationInput } from '../utils/validation.js';
import bcrypt from 'bcryptjs';
const JWT_SECRET = process.env.JWT_SECRET;
// Verify JWT secret is configured
if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured in environment variables!');
    process.exit(1);
}
const generateToken = (userId) => {
    try {
        console.log('Generating token for user ID:', userId);
        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
        console.log('Token generated successfully');
        return token;
    }
    catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Failed to generate authentication token');
    }
};
export const register = async (req, res) => {
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
        });
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
};
export const login = async (req, res) => {
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
        const user = await User.findOne({ email });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};
export const getProfile = async (req, res) => {
    try {
        console.log('Fetching profile for user ID:', req.user._id);
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            console.log('Profile fetch failed: User not found with ID:', req.user._id);
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
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile',
            error: error.message
        });
    }
};
export const updateProfile = async (req, res) => {
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
        const user = await User.findByIdAndUpdate(req.user._id, { firstName, lastName }, { new: true }).select('-password');
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
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile',
            error: error.message
        });
    }
};
export const updatePassword = async (req, res) => {
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
        const user = await User.findById(req.user._id);
        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
            return;
        }
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        // Update password directly without triggering full model validation
        await User.findByIdAndUpdate(req.user._id, { $set: { password: hashedPassword } }, { runValidators: false });
        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    }
    catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating password',
            error: error.message
        });
    }
};
export const validateCurrentPassword = async (req, res) => {
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
        const user = await User.findById(req.user._id);
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
    }
    catch (error) {
        console.error('Password validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while validating password',
            error: error.message
        });
    }
};
