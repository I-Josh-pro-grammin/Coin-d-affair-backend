import pool from './src/config/database.js';

async function fixConstraint() {
  try {
    console.log("Dropping old constraint...");
    await pool.query(`ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_location_id_fkey;`);

    console.log("Adding new constraint pointing to locations table...");
    await pool.query(`
      ALTER TABLE listings 
      ADD CONSTRAINT listings_location_id_fkey 
      FOREIGN KEY (location_id) 
      REFERENCES locations(location_id);
    `);

    console.log("Constraint fixed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing constraint:", error);
    process.exit(1);
  }
}

fixConstraint();
