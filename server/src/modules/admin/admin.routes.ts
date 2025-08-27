import express from 'express';
import {
  getAllUsers,
  getUserTimeEntries,
  getTimeReport,
  updateUserRole,
  exportTableData,
  getTimeLogs,
  exportTimeLogs,
} from './admin.controller.js';
import { auth, isAdmin } from '../../shared/middleware/auth.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { updateRoleSchema, updateRoleParamsSchema } from '../user/user.validator.js';

const router = express.Router();

router.use(auth);
router.use(isAdmin);

router.get('/users', getAllUsers);
router.get('/users/:userId/time-entries', getUserTimeEntries);
router.get('/reports/time', getTimeReport);
router.get('/time/logs', getTimeLogs);
router.get('/time/logs/export', exportTimeLogs);
router.patch(
  '/users/:userId/role',
  validateRequest({ params: updateRoleParamsSchema, body: updateRoleSchema }),
  (req, res) => updateUserRole(req as any, res),
);
router.get('/table/export', exportTableData);

export default router;
