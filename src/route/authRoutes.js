import express from 'express';
import { register, loginController, verifyEmail } from '../controllers/authController.js';
import { loginLimiter } from '../middlewares/rateLimiting.js';

const router = new express.Router()

router.post('/auth/register',register);
router.post('/auth/login',loginLimiter,loginController);
router.get('/verify/:verifyToken',verifyEmail);

export default router;