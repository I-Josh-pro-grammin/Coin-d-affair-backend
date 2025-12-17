import pool from "../config/database.js";

const addColumns = async () => {
  try {
    console.log("Adding columns to businesses table...");
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0.00;
    `);
    console.log("Columns added.");
    process.exit(0);
  } catch (err) {
    console.error("Error adding columns:", err);
    process.exit(1);
  }
};

addColumns();
