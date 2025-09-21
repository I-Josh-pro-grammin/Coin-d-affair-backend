import * as nodemailer from 'nodemailer'
import dotenv from 'dotenv'
const { createTransport } = nodemailer;

dotenv.config()
const transporter = createTransport({
    service: 'gmail',
    auth:{
        user: process.env.EMAIL_SENDER,
        pass: process.env.APP_PASSWORD
    }
})


export {transporter};