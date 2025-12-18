import pool from "../config/database.js";

const listAllTables = async () => {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log("Existing tables:", res.rows.map(r => r.table_name));
    process.exit(0);
  } catch (err) {
    console.error("Error listing tables:", err);
    process.exit(1);
  }
};

listAllTables();
