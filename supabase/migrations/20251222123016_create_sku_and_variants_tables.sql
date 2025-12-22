/*
  # Create SKU Items and Variant Tables
  
  1. New Tables
    - `sku_items`
      - `sku_item_id` (uuid, primary key)
      - `listing_id` (uuid, references listings, required)
      - `sku` (text, unique, required)
      - `price` (numeric, required)
      - `stock` (integer, default 0)
      - `attributes` (jsonb) - Variant attributes (color, size, etc.)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `variant_types`
      - `variant_id` (uuid, primary key)
      - `listing_id` (uuid, references listings, required)
      - `variant_name` (text, required) - e.g., "Color", "Size"
    
    - `variant_values`
      - `id` (uuid, primary key)
      - `variant_type_id` (uuid, references variant_types, required)
      - `value` (text, required) - e.g., "Red", "Large"
  
  2. Security
    - Enable RLS on all tables
    - Publicly readable for browsing
    - Only listing owners can manage variants
  
  3. Notes
    - SKU items represent specific product variations
    - Variant types and values provide structured product options
*/

CREATE TABLE IF NOT EXISTS sku_items (
  sku_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(listings_id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sku_items ENABLE ROW LEVEL SECURITY;

-- SKU items are publicly readable
CREATE POLICY "SKU items are publicly readable"
  ON sku_items FOR SELECT
  TO public
  USING (true);

-- Listing owners can manage SKU items
CREATE POLICY "Listing owners can manage SKU items"
  ON sku_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings_id = listing_id 
      AND seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings_id = listing_id 
      AND seller_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS variant_types (
  variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(listings_id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE variant_types ENABLE ROW LEVEL SECURITY;

-- Variant types are publicly readable
CREATE POLICY "Variant types are publicly readable"
  ON variant_types FOR SELECT
  TO public
  USING (true);

-- Listing owners can manage variant types
CREATE POLICY "Listing owners can manage variant types"
  ON variant_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings_id = listing_id 
      AND seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings_id = listing_id 
      AND seller_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS variant_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_type_id UUID NOT NULL REFERENCES variant_types(variant_id) ON DELETE CASCADE,
  value TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE variant_values ENABLE ROW LEVEL SECURITY;

-- Variant values are publicly readable
CREATE POLICY "Variant values are publicly readable"
  ON variant_values FOR SELECT
  TO public
  USING (true);

-- Variant type owners can manage variant values
CREATE POLICY "Variant type owners can manage values"
  ON variant_values FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM variant_types vt
      JOIN listings l ON vt.listing_id = l.listings_id
      WHERE vt.variant_id = variant_type_id 
      AND l.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM variant_types vt
      JOIN listings l ON vt.listing_id = l.listings_id
      WHERE vt.variant_id = variant_type_id 
      AND l.seller_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sku_items_listing_id ON sku_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_variant_types_listing_id ON variant_types(listing_id);
CREATE INDEX IF NOT EXISTS idx_variant_values_type_id ON variant_values(variant_type_id);
