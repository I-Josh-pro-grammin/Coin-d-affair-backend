import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'));

const sslConfig = isProduction
    ? { rejectUnauthorized: false }
    : (process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false); // false disables SSL

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: sslConfig
        }
        : {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DATABASE,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            ssl: sslConfig
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