-- Add verification_status column to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'approved';

-- For existing non-user accounts that are not verified, set to pending
UPDATE users
SET verification_status = 'pending'
WHERE account_type <> 'user' AND is_verified = false;

-- Add index to speed up queries filtering by verification_status
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
