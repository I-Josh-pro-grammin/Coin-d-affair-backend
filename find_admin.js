import pool from "./src/config/database.js";

async function listAccountTypes() {
    try {
        const result = await pool.query("SELECT DISTINCT account_type FROM users");
        console.log("Unique Account Types:");
        console.table(result.rows);

        // Also list first 5 users to see their structure
        const users = await pool.query("SELECT email, full_name, account_type FROM users LIMIT 5");
        console.log("\nFirst 5 Users:");
        console.table(users.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

listAccountTypes();
