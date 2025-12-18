import pool from './src/config/database.js';
import fs from 'fs';

async function getConstraints() {
  try {
    const constraints = await pool.query(`
      SELECT
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'listings';
    `);
    fs.writeFileSync('listings_constraints.json', JSON.stringify(constraints.rows, null, 2));
    console.log("Constraints written to listings_constraints.json");
    process.exit(0);
  } catch (error) {
    console.error("Error getting constraints:", error);
    process.exit(1);
  }
}

getConstraints();
