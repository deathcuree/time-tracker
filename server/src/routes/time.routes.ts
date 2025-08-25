import express from 'express';
import { clockIn, clockOut, getTimeEntries, getCurrentStatus, getTimeStats, deleteTimeEntry } from '../controllers/time.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/entries', getTimeEntries);
router.delete('/entries/:id', deleteTimeEntry);
router.get('/status', getCurrentStatus);
router.get('/stats', getTimeStats);

export default router; 