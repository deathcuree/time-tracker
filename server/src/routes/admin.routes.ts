import express from 'express';
import { body } from 'express-validator';
import { getAllUsers, getUserTimeEntries, getTimeReport, updateUserRole, exportTableData } from '../controllers/admin.controller.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.use(isAdmin);

router.get('/users', getAllUsers);
router.get('/users/:userId/time-entries', getUserTimeEntries);
router.get('/reports/time', getTimeReport);
router.patch('/users/:userId/role',
  body('role').isIn(['user', 'admin']).withMessage('Invalid role'),
  updateUserRole
);
router.get('/table/export', exportTableData);

export default router;