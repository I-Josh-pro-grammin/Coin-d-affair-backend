import pool from "../config/database.js";

const checkSpecificTables = async () => {
  try {
    const tables = ['listings', 'locations', 'listing_media'];
    for (const table of tables) {
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1;
      `, [table]);
      console.log(`Table ${table} columns:`, columns.rows.map(r => `${r.column_name} (${r.data_type})`).join(", "));
    }

    const res3 = await pool.query(`SELECT * FROM locations LIMIT 5;`);
    console.log("Sample locations:", res3.rows);

    process.exit(0);
  } catch (err) {
    console.error("Error checking tables:", err);
    process.exit(1);
  }
};

checkSpecificTables();
