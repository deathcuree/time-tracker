import express from 'express';
import { createUser } from '../controllers/user.controller.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateRequest } from '../middleware/validate.js';
import { createUserValidation } from '../validators/user.validator.js';

const router = express.Router();

router.post('/', auth, isAdmin, createUserValidation, validateRequest, asyncHandler(createUser));

export default router;
