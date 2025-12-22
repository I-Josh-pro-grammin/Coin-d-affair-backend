/*
  # Create Listings Table
  
  1. New Tables
    - `listings`
      - `listings_id` (uuid, primary key)
      - `seller_id` (uuid, references users, required)
      - `business_id` (uuid, references businesses)
      - `category_id` (uuid, references categories)
      - `subcategory_id` (uuid, references subcategories)
      - `title` (text, required)
      - `description` (text)
      - `price` (numeric, required)
      - `currency` (text, default 'USD')
      - `condition` (text) - e.g., 'new', 'used'
      - `is_negotiable` (boolean, default false)
      - `can_deliver` (boolean, default false)
      - `stock` (integer, default 0)
      - `attributes` (jsonb, default {}) - Flexible product attributes
      - `location_id` (uuid, references locations)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `listings` table
    - Sellers can manage their own listings
    - Everyone can read listings (public marketplace)
    - Admins can manage all listings
  
  3. Notes
    - Supports multiple currencies (USD, RWF, etc.)
    - JSONB attributes for flexible product specifications
    - Stock management for inventory tracking
*/

CREATE TABLE IF NOT EXISTS listings (
  listings_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  condition TEXT,
  is_negotiable BOOLEAN DEFAULT FALSE,
  can_deliver BOOLEAN DEFAULT FALSE,
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  location_id UUID REFERENCES locations(location_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Everyone can read listings (public marketplace)
CREATE POLICY "Listings are publicly readable"
  ON listings FOR SELECT
  TO public
  USING (true);

-- Sellers can create their own listings
CREATE POLICY "Sellers can create own listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own listings
CREATE POLICY "Sellers can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can delete their own listings
CREATE POLICY "Sellers can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Admins can manage all listings
CREATE POLICY "Admins can manage all listings"
  ON listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_business_id ON listings(business_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_subcategory_id ON listings(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_listings_location_id ON listings(location_id);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_title_search ON listings USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_listings_description_search ON listings USING gin(to_tsvector('english', description));
