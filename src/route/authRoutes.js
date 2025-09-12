const express = require('express')
const authRouter = express.Router()
const {register,login,verifyEmail} = require('../controllers/authController')

router.post('/auth/register',register);
router.post('/auth/login',login);
router.get('/verify/:verifyToken',verifyEmail);

module.exports = authRouter