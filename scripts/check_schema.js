import pool from '../src/config/database.js';

const checkSchema = async () => {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'businesses';
        `);
        console.log('Columns in businesses table:', res.rows.map(r => r.column_name));
        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
};

checkSchema();
