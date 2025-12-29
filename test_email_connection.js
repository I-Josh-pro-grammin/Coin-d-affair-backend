import dotenv from 'dotenv';
import { createTransport } from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log("Checking environment variables...");
console.log("EMAIL_SENDER set:", !!process.env.EMAIL_SENDER);
console.log("APP_PASSWORD set:", !!process.env.APP_PASSWORD);

if (!process.env.EMAIL_SENDER || !process.env.APP_PASSWORD) {
    console.error("Missing email credentials in .env");
    process.exit(1);
}

const transporter = createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.APP_PASSWORD
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.log("Connection failed!");
        console.error(error);
    } else {
        console.log("Server is ready to take our messages");
    }
});
