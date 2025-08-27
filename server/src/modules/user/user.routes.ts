import express from 'express';
import { createUser } from './user.controller.js';
import { auth, isAdmin } from '../../shared/middleware/auth.js';

const router = express.Router();

router.post('/', auth, isAdmin, createUser);

export default router;
