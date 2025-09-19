import { Router } from 'express';
const router = Router()
import { register, login, verifyEmail } from '../controllers/authController';

router.post('/auth/register',register);
router.post('/auth/login',login);
router.get('/verify/:verifyToken',verifyEmail);

export default authRouter