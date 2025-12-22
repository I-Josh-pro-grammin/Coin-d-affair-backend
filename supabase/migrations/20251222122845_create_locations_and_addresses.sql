/*
  # Create Locations and Addresses Tables
  
  1. New Tables
    - `locations`
      - `location_id` (uuid, primary key)
      - `name` (text, unique, required) - City/area name
      - `created_at` (timestamp)
    
    - `addresses`
      - `address_id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `label` (text) - e.g., "Home", "Office"
      - `street` (text)
      - `city` (text)
      - `region` (text)
      - `country` (text, default 'Rwanda')
      - `location` (geography point) - PostGIS geography type
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Locations are publicly readable
    - Users can manage their own addresses
  
  3. Initial Data
    - Populate with Rwanda cities
*/

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Anyone can read locations
CREATE POLICY "Locations are publicly readable"
  ON locations FOR SELECT
  TO public
  USING (true);

-- Only admins can insert/update locations
CREATE POLICY "Admins can manage locations"
  ON locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  label TEXT,
  street TEXT,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'Rwanda',
  location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Users can read their own addresses
CREATE POLICY "Users can read own addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can create own addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert initial Rwanda locations
INSERT INTO locations (name) VALUES
  ('Kigali'),
  ('Butare'),
  ('Gisenyi'),
  ('Ruhengeri'),
  ('Cyangugu'),
  ('Muhanga'),
  ('Byumba'),
  ('Kibuye')
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_location ON addresses USING GIST(location);
