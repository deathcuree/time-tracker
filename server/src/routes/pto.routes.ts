import { Router, Request, Response } from 'express';
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
import { ptoRequestValidation } from '../validators/pto.validator.js';

const router = Router();

router.use(auth);

router.post('/request', ptoRequestValidation, validateRequest, createRequest);
router.get('/user', getUserRequests);
router.get('/all', isAdmin, getAllRequests);
router.patch('/request/:requestId', isAdmin, (req: Request, res: Response) => {
  return updateRequestStatus(req as any, res);
});

router.get('/user/month/:year/:month', auth, (req: Request, res: Response) => {
  return getMonthlyRequestCount(req, res);
});

router.get('/user/year/:year', auth, (req: Request, res: Response) => {
  return getYearlyPTOHours(req, res);
});

export default router;
