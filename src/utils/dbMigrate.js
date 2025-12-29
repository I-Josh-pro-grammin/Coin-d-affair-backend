
import pool from '../config/database.js';

export const runMigrations = async () => {
    console.log("Checking database migrations...");
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Users table: seller_verification_status
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'seller_verification_status') THEN
                    ALTER TABLE users ADD COLUMN seller_verification_status VARCHAR(50) DEFAULT 'none';
                END IF;
            END
            $$;
        `);

        // 2. Seller Verifications Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS seller_verifications (
                verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'pending',
                id_type VARCHAR(50),
                id_number VARCHAR(100),
                document_front_url TEXT,
                document_back_url TEXT,
                selfie_url TEXT,
                whatsapp_number VARCHAR(50),
                location_city VARCHAR(100),
                rejection_reason TEXT,
                reviewed_by UUID REFERENCES users(user_id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add indexes if not exist (simple check to avoid errors if they exist)
        // PostgreSQL doesn't support "CREATE INDEX IF NOT EXISTS" in older versions, but most recent do.
        // using exception block to be safe or IF NOT EXISTS (pg 9.5+)
        await client.query(`CREATE INDEX IF NOT EXISTS idx_seller_verifications_status ON seller_verifications(status);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_seller_verifications_user_id ON seller_verifications(user_id);`);


        // 3. Listings Table: is_approved, is_visible, rejection_reason
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'is_approved') THEN
                    ALTER TABLE listings ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'is_visible') THEN
                    ALTER TABLE listings ADD COLUMN is_visible BOOLEAN DEFAULT TRUE;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'rejection_reason') THEN
                    ALTER TABLE listings ADD COLUMN rejection_reason TEXT;
                END IF;
            END
            $$;
        `);

        // Update null is_approved (fallback)
        await client.query(`UPDATE listings SET is_approved = TRUE WHERE is_approved IS NULL`);

        await client.query('COMMIT');
        console.log("Database migrations completed successfully.");

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", error);
        // We don't exit process here, but log it. 
        // In strict env, might want to process.exit(1)
    } finally {
        client.release();
    }
};
