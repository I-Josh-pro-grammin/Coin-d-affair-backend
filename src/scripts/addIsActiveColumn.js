import pool from "../config/database.js";

const addColumn = async () => {
  try {
    console.log("Adding is_active column to users table...");
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    `);
    console.log("is_active column added.");
    process.exit(0);
  } catch (err) {
    console.error("Error adding column:", err);
    process.exit(1);
  }
};

addColumn();
