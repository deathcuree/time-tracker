import { body } from 'express-validator';

export const createUserValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Invalid role'),
  body('position')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Position must be at least 2 characters'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];
