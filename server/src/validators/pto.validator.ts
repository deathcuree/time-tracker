import { body } from 'express-validator';

export const ptoRequestValidation = [
  body('date').isISO8601().withMessage('Invalid date'),
  body('hours').isInt({ min: 1, max: 8 }).withMessage('Hours must be between 1 and 8'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
];
