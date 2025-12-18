import pool from "../config/database.js";

const initDatabaseFixes = async () => {
  try {
    console.log("Creating locations table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("Populating locations...");
    const cities = ['Kigali', 'Butare', 'Gisenyi', 'Ruhengeri', 'Cyangugu', 'Muhanga', 'Byumba', 'Kibuye'];
    for (const city of cities) {
      await pool.query(`
        INSERT INTO locations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING;
      `, [city]);
    }

    console.log("Fixing listings table schema...");
    // Change currency to TEXT to support "RWF"
    await pool.query(`
      ALTER TABLE listings ALTER COLUMN currency TYPE TEXT;
    `);

    console.log("Database fixes completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error fixing database:", err);
    process.exit(1);
  }
};

initDatabaseFixes();
