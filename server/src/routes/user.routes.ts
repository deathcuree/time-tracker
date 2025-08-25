import express from 'express';
import { body } from 'express-validator';
import { createUser } from '../controllers/user.controller.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

const createUserValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('role').isIn(['user', 'admin']).withMessage('Invalid role'),
  body('position').trim().isLength({ min: 2 }).withMessage('Position must be at least 2 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

router.post('/', auth, isAdmin, createUserValidation, validateRequest, asyncHandler(createUser));

export default router;