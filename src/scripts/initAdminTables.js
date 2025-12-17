import pool from "../config/database.js";

const createTables = async () => {
  try {
    console.log("Creating admin_logs table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        log_id SERIAL PRIMARY KEY,
        admin_user_id UUID REFERENCES users(user_id),
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(255),
        resource_id VARCHAR(255),
        meta JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("admin_logs table created.");

    console.log("Creating admin_notifications table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        notification_id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        body TEXT,
        target_user_id UUID REFERENCES users(user_id),
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("admin_notifications table created.");

    process.exit(0);
  } catch (err) {
    console.error("Error creating tables:", err);
    process.exit(1);
  }
};

createTables();
