import { Router } from 'express';
import { body } from 'express-validator';
import { createRequest, getUserRequests, getAllRequests, updateRequestStatus, getMonthlyRequestCount, getYearlyPTOHours } from '../controllers/pto.controller.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
const router = Router();
// Protect all routes
router.use(auth);
// Validation middleware
const ptoRequestValidation = [
    body('date').isISO8601().withMessage('Invalid date'),
    body('hours').isInt({ min: 1, max: 8 }).withMessage('Hours must be between 1 and 8'),
    body('reason').trim().notEmpty().withMessage('Reason is required')
];
// Routes
router.post('/request', ptoRequestValidation, validateRequest, createRequest);
router.get('/user', getUserRequests);
router.get('/all', isAdmin, getAllRequests);
router.patch('/request/:requestId', isAdmin, (req, res) => {
    return updateRequestStatus(req, res);
});
// Get monthly PTO request count
router.get('/user/month/:year/:month', auth, (req, res) => {
    return getMonthlyRequestCount(req, res);
});
// Get yearly PTO hours
router.get('/user/year/:year', auth, (req, res) => {
    return getYearlyPTOHours(req, res);
});
export default router;
