import express from 'express';
import { body } from 'express-validator';
import { getAllUsers, getUserTimeEntries, getTimeReport, updateUserRole } from '../controllers/admin.controller.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes with auth and admin middleware
router.use(auth);
router.use(isAdmin);

// Routes
router.get('/users', getAllUsers);
router.get('/users/:userId/time-entries', getUserTimeEntries);
router.get('/reports/time', getTimeReport);
router.patch('/users/:userId/role', 
  body('role').isIn(['user', 'admin']).withMessage('Invalid role'),
  updateUserRole
);

export default router; 