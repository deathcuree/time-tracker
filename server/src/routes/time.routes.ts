import express from 'express';
import { clockIn, clockOut, getTimeEntries, getCurrentStatus, getTimeStats } from '../controllers/time.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(auth);

// Routes
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/entries', getTimeEntries);
router.get('/status', getCurrentStatus);
router.get('/stats', getTimeStats);

export default router; 