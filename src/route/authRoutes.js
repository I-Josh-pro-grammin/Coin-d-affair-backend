import express from 'express';
import { register, loginController, verifyEmail } from '../controllers/authController.js';

const router = new express.Router()

router.post('/auth/register',register);
router.post('/auth/login',loginController);
router.get('/verify/:verifyToken',verifyEmail);

export default router;