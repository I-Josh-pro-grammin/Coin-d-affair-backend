import pool from "./src/config/database.js";
import { hashPassword } from "./src/utils/hash.js";
import crypto from "crypto";

const testRegister = async () => {
    const email = `debug_test_${Date.now()}@example.com`;
    const password = "password123";
    const fullName = "Debug Tester";
    const accountType = "user";
    const phone = "0600000000";

    console.log("Starting debug registration...");
    console.log(`Email: ${email}`);

    try {
        // Test DB Connection first
        console.log("Testing basic DB query...");
        const now = await pool.query("SELECT NOW()");
        console.log("DB Connected:", now.rows[0]);

        // Check existing email
        console.log("Checking existing email...");
        const existingEmail = await pool.query(
            `SELECT user_id FROM users where email = $1`,
            [email]
        );

        if (existingEmail.rows.length > 0) {
            console.log("Account already exists");
            return;
        }

        const emailVerifyToken = crypto.randomUUID();
        const hashedPassword = await hashPassword(password);

        console.log("Inserting user...");
        const userResult = await pool.query(
            `INSERT INTO users (email,phone,password,full_name,account_type,verifyToken) values ($1,$2,$3,$4,$5,$6) RETURNING user_id`,
            [
                email,
                phone,
                hashedPassword,
                fullName,
                accountType,
                emailVerifyToken
            ]
        );

        console.log("User inserted:", userResult.rows[0]);
        process.exit(0);

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        process.exit(1);
    }
};

testRegister();
