import pool from "../config/database.js";

const checkTables = async () => {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log("Tables:", res.rows.map(r => r.table_name).join(", "));

    const tables = ['listings', 'locations', 'listing_media', 'categories', 'subcategories'];
    for (const table of tables) {
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1;
      `, [table]);
      console.log(`Table ${table} columns:`, columns.rows.map(r => `${r.column_name} (${r.data_type})`).join(", "));
    }

    process.exit(0);
  } catch (err) {
    console.error("Error checking tables:", err);
    process.exit(1);
  }
};

checkTables();
