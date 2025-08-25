import express from 'express';
import { body } from 'express-validator';
import {
  loginValidation,
  updatePasswordValidation,
  updateProfileValidation,
} from '../validators/auth.validator.js';
import {
  login,
  getProfile,
  updateProfile,
  updatePassword,
  validateCurrentPassword,
  logout,
} from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/login', loginRateLimiter, loginValidation, asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/profile', auth, asyncHandler(getProfile));
router.put('/profile', auth, updateProfileValidation, asyncHandler(updateProfile));
router.put('/password', auth, updatePasswordValidation, asyncHandler(updatePassword));
router.post(
  '/validate-password',
  auth,
  body('password').notEmpty().withMessage('Password is required'),
  asyncHandler(validateCurrentPassword),
);

export default router;
