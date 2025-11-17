import express from 'express';
import { register, loginController, verifyEmail, getCurrentUser } from '../controllers/authController.js';
import { loginLimiter } from '../middlewares/rateLimiting.js';
import protectedRoutes from '../middlewares/authMiddleware.js';

const router = new express.Router()

router.post('/auth/register', register);
router.post('/auth/login', loginLimiter, loginController);
router.get('/auth/verify/:verifyToken', verifyEmail);
router.get('/auth/me', protectedRoutes(), getCurrentUser);

export default router;