import express, { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { createRequest, getUserRequests, getAllRequests, updateRequestStatus } from '../controllers/pto.controller.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

// Protect all routes
router.use(auth);

// Validation middleware
const ptoRequestValidation = [
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('reason').trim().notEmpty().withMessage('Reason is required')
];

// Routes
router.post('/request', ptoRequestValidation, validateRequest, createRequest);
router.get('/user', getUserRequests);
router.get('/all', isAdmin, getAllRequests);
router.patch('/request/:requestId', isAdmin, (req: Request, res: Response) => {
  return updateRequestStatus(req as any, res);
});

export default router; 