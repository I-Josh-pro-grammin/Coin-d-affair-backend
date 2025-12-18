import pool from "../config/database.js";

const updateCategoriesSchema = async () => {
  try {
    console.log("Adding columns to categories table...");
    await pool.query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS name_fr TEXT,
      ADD COLUMN IF NOT EXISTS icon TEXT,
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    console.log("Categories columns added.");

    console.log("Adding name_fr column to subcategories table...");
    await pool.query(`
      ALTER TABLE subcategories 
      ADD COLUMN IF NOT EXISTS name_fr TEXT;
    `);
    console.log("Subcategories column added.");

    process.exit(0);
  } catch (err) {
    console.error("Error updating schema:", err);
    process.exit(1);
  }
};

updateCategoriesSchema();
