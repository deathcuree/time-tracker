import express from 'express';
import { body } from 'express-validator';
import { login, getProfile, updateProfile, updatePassword, validateCurrentPassword, logout } from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
];

const updatePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfileValidation, updateProfile);
router.put('/password', auth, updatePasswordValidation, updatePassword);
router.post('/validate-password', auth, body('password').notEmpty().withMessage('Password is required'), validateCurrentPassword);

export default router; 