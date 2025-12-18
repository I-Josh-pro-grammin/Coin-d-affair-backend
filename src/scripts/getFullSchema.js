import pool from "../config/database.js";

const getFullSchema = async () => {
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    const tables = tablesRes.rows.map(r => r.table_name);

    const schema = {};
    for (const table of tables) {
      const columnsRes = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1;
      `, [table]);
      schema[table] = columnsRes.rows.map(r => ({ name: r.column_name, type: r.data_type }));
    }

    console.log("SCHEMA_START");
    console.log(JSON.stringify(schema, null, 2));
    console.log("SCHEMA_END");
    process.exit(0);
  } catch (err) {
    console.error("Error getting schema:", err);
    process.exit(1);
  }
};

getFullSchema();
