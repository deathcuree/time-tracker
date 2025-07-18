import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateLoginInput, validateRegistrationInput } from '../utils/validation.js';
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    process.exit(1);
}
const generateToken = (userId) => {
    try {
        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
        return token;
    }
    catch (error) {
        throw new Error('Failed to generate authentication token');
    }
};
export const register = async (req, res) => {
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
        });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
};
export const login = async (req, res) => {
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
        const user = await User.findOne({ email });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};
export const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.json({ success: true, message: 'Logged out successfully' });
};
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
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
        // Update password
        user.password = newPassword;
        await user.save(); // This will trigger the pre-save hook to hash the password
        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    }
    catch (error) {
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
        res.status(500).json({
            success: false,
            message: 'Server error while validating password',
            error: error.message
        });
    }
};
