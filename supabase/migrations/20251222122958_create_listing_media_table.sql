/*
  # Create Listing Media Table
  
  1. New Tables
    - `listing_media`
      - `listing_media_id` (uuid, primary key)
      - `listing_id` (uuid, references listings, required)
      - `media_type` (text, required) - 'image' or 'video'
      - `url` (text, required) - Cloudinary URL
      - `sort_order` (integer, default 0) - Display order
      - `metadata` (jsonb) - Cloudinary metadata (public_id, etc.)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `listing_media` table
    - Anyone can read media (public)
    - Only listing owners can add/update/delete media
    - Admins can manage all media
  
  3. Notes
    - Supports images and videos
    - Stores Cloudinary URLs and metadata
    - Sort order for controlling display sequence
*/

CREATE TABLE IF NOT EXISTS listing_media (
  listing_media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(listings_id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE listing_media ENABLE ROW LEVEL SECURITY;

-- Anyone can read media
CREATE POLICY "Media is publicly readable"
  ON listing_media FOR SELECT
  TO public
  USING (true);

-- Listing owners can add media to their listings
CREATE POLICY "Listing owners can add media"
  ON listing_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings_id = listing_id 
      AND seller_id = auth.uid()
    )
  );

-- Listing owners can update their media
CREATE POLICY "Listing owners can update media"
  ON listing_media FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings_id = listing_id 
      AND seller_id = auth.uid()
    )
  );

-- Listing owners can delete their media
CREATE POLICY "Listing owners can delete media"
  ON listing_media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings_id = listing_id 
      AND seller_id = auth.uid()
    )
  );

-- Admins can manage all media
CREATE POLICY "Admins can manage all media"
  ON listing_media FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_listing_media_listing_id ON listing_media(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_media_sort_order ON listing_media(listing_id, sort_order);
