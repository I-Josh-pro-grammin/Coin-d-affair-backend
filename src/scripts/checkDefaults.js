import pool from "../config/database.js";

const checkDefaults = async () => {
  try {
    const res = await pool.query(`
      SELECT column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'listing_media' AND column_name = 'listing_media_id';
    `);
    console.log("listing_media_id default:", res.rows[0]?.column_default);

    const res2 = await pool.query(`
      SELECT column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'listings' AND column_name = 'listings_id';
    `);
    console.log("listings_id default:", res2.rows[0]?.column_default);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDefaults();
