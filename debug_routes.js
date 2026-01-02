import express from 'express';
import pool from './src/config/database.js';
import cloudinary from './src/config/cloudinary.js';

const router = express.Router();

router.get('/test-db', async (req, res) => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: Date.now() - start, result: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/test-cloudinary', async (req, res) => {
  try {
    const start = Date.now();
    const result = await cloudinary.api.ping();
    res.json({ success: true, time: Date.now() - start, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/test-schema', async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'listings'
        `);
    res.json({ success: true, columns: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
