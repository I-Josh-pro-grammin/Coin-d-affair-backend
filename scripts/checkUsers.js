
import dotenv from 'dotenv';
import pool from '../src/config/database.js';

dotenv.config();

const checkUsers = async () => {
    try {
        console.log('🔍 Checking for admin users...');

        const result = await pool.query(
            "SELECT user_id, email, account_type, is_verified, full_name, left(password, 10) as pass_start FROM users WHERE account_type = 'admin' OR email LIKE '%izere%'"
        );

        console.table(result.rows);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error checking users:', error);
        process.exit(1);
    }
};

checkUsers();
