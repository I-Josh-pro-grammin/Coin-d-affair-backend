import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        }
        : {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DATABASE,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            ssl: {
                rejectUnauthorized: false
            }
        }
);

try {
    pool.on('connect', () => {
        console.log("✅ Database connected successfully");
    });

    pool.on('error', (err) => {
        console.error("❌ Database pool error:", err.message);
    });
} catch (error) {
    console.log("❌ Database connection failed", error.message);
}

export default pool;