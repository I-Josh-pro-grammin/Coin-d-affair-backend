/*
  # Create Businesses Table
  
  1. New Tables
    - `businesses`
      - `business_id` (uuid, primary key)
      - `user_id` (uuid, references users, unique)
      - `business_name` (text, required)
      - `vat_number` (text)
      - `subscription_plan` (text, default 'free')
      - `is_paid` (boolean, default false)
      - `subscription_start` (timestamp)
      - `subscription_period_end` (timestamp)
      - `total_orders` (integer, default 0)
      - `total_sales` (numeric, default 0)
      - `rating` (numeric, default 0.00)
      - `stripe_account_id` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `businesses` table
    - Business owners can read and update their own business
    - Anyone can read business info (public listings)
    - Admins can manage all businesses
  
  3. Notes
    - Each user can have only one business (unique constraint on user_id)
    - Subscription management for business accounts
*/

CREATE TABLE IF NOT EXISTS businesses (
  business_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  vat_number TEXT,
  subscription_plan TEXT DEFAULT 'free',
  is_paid BOOLEAN DEFAULT FALSE,
  subscription_start TIMESTAMP DEFAULT NOW(),
  subscription_period_end TIMESTAMP,
  total_orders INTEGER DEFAULT 0,
  total_sales NUMERIC(10,2) DEFAULT 0.00,
  rating NUMERIC(3,2) DEFAULT 0.00,
  stripe_account_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Business owners can read their own business
CREATE POLICY "Business owners can read own business"
  ON businesses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can read businesses (for public product listings)
CREATE POLICY "Businesses are publicly readable"
  ON businesses FOR SELECT
  TO public
  USING (true);

-- Business owners can update their own business
CREATE POLICY "Business owners can update own business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can create their own business
CREATE POLICY "Users can create own business"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all businesses
CREATE POLICY "Admins can manage businesses"
  ON businesses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription ON businesses(subscription_plan, subscription_period_end);
