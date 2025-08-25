import express, { Router } from 'express';
import { body } from 'express-validator';
import { createRequest, getUserRequests, getAllRequests, updateRequestStatus, getMonthlyRequestCount, getYearlyPTOHours } from '../controllers/pto.controller.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(auth);

const ptoRequestValidation = [
  body('date').isISO8601().withMessage('Invalid date'),
  body('hours').isInt({ min: 1, max: 8 }).withMessage('Hours must be between 1 and 8'),
  body('reason').trim().notEmpty().withMessage('Reason is required')
];

router.post('/request', ptoRequestValidation, validateRequest, asyncHandler(createRequest));
router.get('/user', asyncHandler(getUserRequests));
router.get('/all', isAdmin, asyncHandler(getAllRequests));
router.patch('/request/:requestId', isAdmin, asyncHandler(updateRequestStatus as any));

router.get('/user/month/:year/:month', auth, asyncHandler(getMonthlyRequestCount));

router.get('/user/year/:year', auth, asyncHandler(getYearlyPTOHours));

export default router;