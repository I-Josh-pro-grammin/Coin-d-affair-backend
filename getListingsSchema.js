import pool from './src/config/database.js';
import fs from 'fs';

async function getSchema() {
  try {
    const schema = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'listings'
      ORDER BY ordinal_position;
    `);
    fs.writeFileSync('listings_schema_result.json', JSON.stringify(schema.rows, null, 2));
    console.log("Schema written to listings_schema_result.json");
    process.exit(0);
  } catch (error) {
    console.error("Error getting schema:", error);
    process.exit(1);
  }
}

getSchema();
