import express from 'express';
import { createUser } from '../controllers/user.controller.js';
import { auth, isAdmin } from '../middleware/auth.js';
const router = express.Router();
// Create new user (admin only)
router.post('/', auth, isAdmin, createUser);
export default router;
