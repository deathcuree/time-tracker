import { Router } from 'express';
import { ptoRequestValidation } from '../validators/pto.validator.js';
import {
  createRequest,
  getUserRequests,
  getAllRequests,
  updateRequestStatus,
  getMonthlyRequestCount,
  getYearlyPTOHours,
} from '../controllers/pto.controller.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(auth);

router.post('/request', ptoRequestValidation, validateRequest, asyncHandler(createRequest));
router.get('/user', asyncHandler(getUserRequests));
router.get('/all', isAdmin, asyncHandler(getAllRequests));
router.patch('/request/:requestId', isAdmin, asyncHandler(updateRequestStatus as any));
router.get('/user/month/:year/:month', auth, asyncHandler(getMonthlyRequestCount));
router.get('/user/year/:year', auth, asyncHandler(getYearlyPTOHours));

export default router;
