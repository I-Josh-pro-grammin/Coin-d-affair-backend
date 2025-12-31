import pool from '../src/config/database.js';

const addContactFields = async () => {
    try {
        console.log('Adding whatsapp and website columns to businesses table...');

        // Add whatsapp column if it doesn't exist
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='businesses' AND column_name='whatsapp') THEN 
                    ALTER TABLE businesses ADD COLUMN whatsapp text; 
                END IF; 
            END $$;
        `);

        // Add website column if it doesn't exist
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='businesses' AND column_name='website') THEN 
                    ALTER TABLE businesses ADD COLUMN website text; 
                END IF; 
            END $$;
        `);

        // Add contact_email column if it doesn't exist (referenced in Settings.tsx as businesses.contact_email)
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='businesses' AND column_name='contact_email') THEN 
                    ALTER TABLE businesses ADD COLUMN contact_email text; 
                END IF; 
            END $$;
        `);

        console.log('Successfully added contact fields to businesses table.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
};

addContactFields();
