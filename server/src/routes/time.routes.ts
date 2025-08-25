import express from 'express';
import { clockIn, clockOut, getTimeEntries, getCurrentStatus, getTimeStats } from '../controllers/time.controller.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(auth);

router.post('/clock-in', asyncHandler(clockIn));
router.post('/clock-out', asyncHandler(clockOut));
router.get('/entries', asyncHandler(getTimeEntries));
router.get('/status', asyncHandler(getCurrentStatus));
router.get('/stats', asyncHandler(getTimeStats));

export default router;