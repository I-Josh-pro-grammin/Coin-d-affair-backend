import pool from './src/config/database.js';

async function check() {
  try {
    const catId = '77b61fa0-c63f-4adf-a8cb-b15761ace92a';
    const locId = '0124e729-83a9-438f-b572-4c9f1fdcf18c';

    const catRes = await pool.query("SELECT * FROM categories WHERE category_id = $1", [catId]);
    const locRes = await pool.query("SELECT * FROM locations WHERE location_id = $1", [locId]);

    console.log("Category search:", catRes.rowCount > 0 ? "FOUND" : "NOT FOUND");
    console.log("Location search:", locRes.rowCount > 0 ? "FOUND" : "NOT FOUND");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
