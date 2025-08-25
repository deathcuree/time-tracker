import express from 'express';
import { body } from 'express-validator';
import { getAllUsers, getUserTimeEntries, getTimeReport, updateUserRole, exportTableData, getTimeLogs, exportTimeLogs } from '../controllers/admin.controller.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(auth);
router.use(isAdmin);

router.get('/users', asyncHandler(getAllUsers));
router.get('/users/:userId/time-entries', asyncHandler(getUserTimeEntries));
router.get('/reports/time', asyncHandler(getTimeReport));
router.get('/time/logs', asyncHandler(getTimeLogs));
router.get('/time/logs/export', asyncHandler(exportTimeLogs));
router.patch('/users/:userId/role',
  body('role').isIn(['user', 'admin']).withMessage('Invalid role'),
  asyncHandler(updateUserRole)
);
router.get('/table/export', asyncHandler(exportTableData));

export default router;