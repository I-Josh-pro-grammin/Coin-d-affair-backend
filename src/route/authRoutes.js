import express from 'express';
const router = new express.Router();
import { register, login, verifyEmail } from '../controllers/authController.js';

router.post('/auth/register',register);
router.post('/auth/login',login);
router.get('/verify/:verifyToken',verifyEmail);

export default router;