import pool from "../config/database.js";

const checkListingsSchema = async () => {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'listings';
    `);
    console.log("Listings columns:", res.rows.map(r => `${r.column_name} (${r.data_type})`).join(", "));

    const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'locations';
    `);
    console.log("Locations columns:", res2.rows.map(r => `${r.column_name} (${r.data_type})`).join(", "));

    const res3 = await pool.query(`SELECT * FROM locations LIMIT 5;`);
    console.log("Sample locations:", res3.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkListingsSchema();
