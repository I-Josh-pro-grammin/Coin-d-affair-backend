
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pool from '../src/config/database.js';

dotenv.config();

const ADMIN_EMAIL = 'clandem4@gmail.com';
const ADMIN_PASSWORD = "Cl1nd4m'admin";

const updatePassword = async () => {
    try {
        // Allow passing connection string as first argument
        const dbUrl = process.argv[2] || process.env.DATABASE_URL;

        if (dbUrl) {
            console.log('🔄 Connecting to provided database URL...');
            process.env.DATABASE_URL = dbUrl; // Set for pool to use
        } else {
            console.log('🔄 Connecting to local database (no URL provided)...');
        }

        // Re-import pool to ensure it picks up the new env var if set
        // Note: In ESM, re-importing might be cached, but setting the env var before the pool is used usually works if the pool config allows it.
        // However, the pool is initialized in `../src/config/database.js` immediately. 
        // We need to handle this manually here or tell the user to set the env var.
        // EASIER STRATEGY: Create a new pool instance here if a URL is provided.

        let dbClient = pool;
        if (dbUrl) {
            const { Pool } = await import('pg');
            dbClient = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
        }

        console.log('🔄 Updating admin password...');

        // 1. Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

        // 2. Upsert user (Update if exists, Create if not)
        const checkUser = await dbClient.query(
            'SELECT user_id FROM users WHERE email = $1',
            [ADMIN_EMAIL]
        );

        if (checkUser.rows.length > 0) {
            const userId = checkUser.rows[0].user_id;
            console.log(`👤 Found user ${ADMIN_EMAIL} (ID: ${userId}). Updating password and role...`);

            await dbClient.query(
                `UPDATE users 
                 SET password = $1,
                     account_type = 'admin',
                     is_verified = true,
                     verification_status = 'approved',
                     full_name = 'Admin User'
                 WHERE user_id = $2`,
                [hashedPassword, userId]
            );
            console.log(`✅ User updated successfully.`);
        } else {
            console.log(`👤 User ${ADMIN_EMAIL} not found. Creating new admin account...`);
            await dbClient.query(
                `INSERT INTO users (email, password, full_name, account_type, is_verified, verification_status, phone)
                 VALUES ($1, $2, 'Admin User', 'admin', true, 'approved', '0000000000')`,
                [ADMIN_EMAIL, hashedPassword]
            );
            console.log(`✅ New admin user created successfully.`);
        }

        console.log(`
--------------------------------------------------
✅ OPERATION COMPLETE
Target Database: ${dbUrl ? 'Remote (Provided URL)' : 'Local Config'}
Admin Email:     ${ADMIN_EMAIL}
Password:        ${ADMIN_PASSWORD}
--------------------------------------------------
`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error updating password:', error);
        process.exit(1);
    }
};

updatePassword();
