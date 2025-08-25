import express from 'express';
import { body } from 'express-validator';
import {
  login,
  getProfile,
  updateProfile,
  updatePassword,
  validateCurrentPassword,
  logout,
} from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';
import {
  loginValidation,
  updatePasswordValidation,
  updateProfileValidation,
} from '../validators/auth.validator.js';

const router = express.Router();

router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfileValidation, updateProfile);
router.put('/password', auth, updatePasswordValidation, updatePassword);
router.post(
  '/validate-password',
  auth,
  body('password').notEmpty().withMessage('Password is required'),
  validateCurrentPassword,
);

export default router;
