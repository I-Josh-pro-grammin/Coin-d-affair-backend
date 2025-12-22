/*
  # Create Categories and Subcategories Tables
  
  1. New Tables
    - `categories`
      - `category_id` (uuid, primary key)
      - `category_name` (text, required)
      - `name_fr` (text) - French translation
      - `slug` (text, unique, required)
      - `icon` (text) - Icon identifier
      - `description` (text)
      - `created_at` (timestamp)
    
    - `subcategories`
      - `subcategory_id` (uuid, primary key)
      - `category_id` (uuid, references categories)
      - `subcategory_name` (text, required)
      - `name_fr` (text) - French translation
      - `slug` (text, unique, required)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Categories are publicly readable (for browsing)
    - Only admins can create/update/delete categories
  
  3. Notes
    - Supports bilingual content (English and French)
    - Slug for SEO-friendly URLs
*/

CREATE TABLE IF NOT EXISTS categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  name_fr TEXT,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO public
  USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS subcategories (
  subcategory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
  subcategory_name TEXT NOT NULL,
  name_fr TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Anyone can read subcategories
CREATE POLICY "Subcategories are publicly readable"
  ON subcategories FOR SELECT
  TO public
  USING (true);

-- Only admins can manage subcategories
CREATE POLICY "Admins can manage subcategories"
  ON subcategories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON subcategories(slug);
