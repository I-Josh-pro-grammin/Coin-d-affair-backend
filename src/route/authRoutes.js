const express = require('express')
const authRouter = express.Router()
const {register,login,verifyEmail} = require('../controllers/authController')

authRouter.post('/auth/register',register);
authRouter.post('/auth/login',login);
authRouter.get('/verify/:verifyToken',verifyEmail);

module.exports = authRouter