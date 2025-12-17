import pool from "../config/database.js";

const checkTable = async () => {
  try {
    const res = await pool.query(`
      SELECT to_regclass('public.listing_media');
    `);
    console.log("listing_media exists:", !!res.rows[0].to_regclass);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkTable();
