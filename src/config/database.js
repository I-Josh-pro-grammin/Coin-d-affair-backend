import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

try {
    pool.on('connect', () => {
        console.log("Database connected successfully");
    });
} catch (error) {
    console.log("Database connection failed", error.message);
}

export default pool;