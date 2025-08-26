import express from 'express';
import {
  login,
  getProfile,
  updateProfile,
  updatePassword,
  validateCurrentPassword,
  logout,
} from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  loginSchema,
  updatePasswordSchema,
  updateProfileSchema,
  validatePasswordSchema,
} from '../validators/auth.validator.js';

const router = express.Router();

router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/logout', logout);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, validateRequest({ body: updateProfileSchema }), updateProfile);
router.put('/password', auth, validateRequest({ body: updatePasswordSchema }), updatePassword);
router.post(
  '/validate-password',
  auth,
  validateRequest({ body: validatePasswordSchema }),
  validateCurrentPassword,
);

export default router;
