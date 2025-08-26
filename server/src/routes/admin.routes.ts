import express from 'express';
import {
  getAllUsers,
  getUserTimeEntries,
  getTimeReport,
  updateUserRole,
  exportTableData,
  getTimeLogs,
  exportTimeLogs,
} from '../controllers/admin.controller.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { updateRoleSchema, updateRoleParamsSchema } from '../validators/user.validator.js';

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
  // Wrap to satisfy Express RequestHandler generics without changing controller signature
  (req, res) => updateUserRole(req as any, res),
);
router.get('/table/export', exportTableData);

export default router;
