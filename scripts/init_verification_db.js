
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

const migrate = async () => {
    try {
        console.log("Starting migration...");

        // 1. Add seller_verification_status to users if not exists
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'seller_verification_status') THEN
                    ALTER TABLE users ADD COLUMN seller_verification_status VARCHAR(50) DEFAULT 'none';
                END IF;
            END
            $$;
        `);
        console.log("Updated users table.");

        // 2. Create seller_verifications table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS seller_verifications (
                verification_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
                id_type VARCHAR(50), -- passport, national_id, etc.
                id_number VARCHAR(100),
                document_front_url TEXT,
                document_back_url TEXT,
                selfie_url TEXT,
                whatsapp_number VARCHAR(50),
                location_city VARCHAR(100),
                rejection_reason TEXT,
                reviewed_by UUID REFERENCES users(user_id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log("Created seller_verifications table.");

        // 3. Create status index
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_seller_verifications_status ON seller_verifications(status);
            CREATE INDEX IF NOT EXISTS idx_seller_verifications_user ON seller_verifications(user_id);
        `);
        console.log("Created indexes.");

        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
};

migrate();
