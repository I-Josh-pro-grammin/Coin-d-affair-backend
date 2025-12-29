
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

const migrate = async () => {
    try {
        console.log("Starting listings schema migration...");

        // 1. Add is_approved column
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'is_approved') THEN
                    ALTER TABLE listings ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
                END IF;
            END
            $$;
        `);
        console.log("Added is_approved column.");

        // 2. Add is_visible column
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'is_visible') THEN
                    ALTER TABLE listings ADD COLUMN is_visible BOOLEAN DEFAULT TRUE;
                END IF;
            END
            $$;
        `);
        console.log("Added is_visible column.");

        // 3. Add rejection_reason column
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'rejection_reason') THEN
                    ALTER TABLE listings ADD COLUMN rejection_reason TEXT;
                END IF;
            END
            $$;
        `);
        console.log("Added rejection_reason column.");

        // 4. Update existing listings to be approved by default (so they don't disappear)
        await pool.query(`UPDATE listings SET is_approved = TRUE WHERE is_approved IS NULL`);
        console.log("Updated existing listings to approved.");

        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
};

migrate();
