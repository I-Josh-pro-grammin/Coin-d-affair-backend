import pool from "../config/database.js";

const checkSchema = async () => {
  try {
    const res = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'user_id';
    `);
    console.log("user_id type:", res.rows[0]?.data_type);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkSchema();
