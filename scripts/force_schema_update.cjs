
const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DATABASE}`,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function run() {
    try {
        console.log("Connecting...");
        await client.connect();
        console.log("Connected to DB");

        // Check columns
        const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'businesses'`);
        const columns = res.rows.map(r => r.column_name);
        console.log("Current columns:", columns);

        if (!columns.includes('whatsapp')) {
            console.log("Adding whatsapp...");
            await client.query("ALTER TABLE businesses ADD COLUMN whatsapp text");
        }
        if (!columns.includes('website')) {
            console.log("Adding website...");
            await client.query("ALTER TABLE businesses ADD COLUMN website text");
        }
        if (!columns.includes('contact_email')) {
            console.log("Adding contact_email...");
            await client.query("ALTER TABLE businesses ADD COLUMN contact_email text");
        }

        console.log("Schema update done.");
        await client.end();
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

run();
