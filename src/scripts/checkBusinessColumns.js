import pool from "../config/database.js";

const checkBusinessColumns = async () => {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'businesses';
    `);
    console.log("Columns:", res.rows.map(r => r.column_name).join(", "));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkBusinessColumns();
