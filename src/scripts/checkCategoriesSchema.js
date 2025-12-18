import pool from "../config/database.js";

const checkCategoriesSchema = async () => {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories';
    `);
    console.log("Categories columns:", res.rows.map(r => `${r.column_name} (${r.data_type})`).join(", "));

    const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subcategories';
    `);
    console.log("Subcategories columns:", res2.rows.map(r => `${r.column_name} (${r.data_type})`).join(", "));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkCategoriesSchema();
