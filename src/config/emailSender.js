const nodemailer = require('nodemailer')
require("dotenv").config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.EMAIL_SENDER,
        pass: process.env.APP_PASSWORD
    }
})

module.exports = transporter