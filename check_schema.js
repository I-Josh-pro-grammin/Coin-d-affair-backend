import pool from './src/config/database.js';

async function check() {
  try {
    const res = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'listings'
            ORDER BY ordinal_position;
        `);
    console.log("SCHEMA_JSON:" + JSON.stringify(res.rows));

    const locRes = await pool.query("SELECT * FROM locations LIMIT 5");
    console.log("LOCATIONS_JSON:" + JSON.stringify(locRes.rows));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
