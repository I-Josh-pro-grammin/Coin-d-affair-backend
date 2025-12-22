/*
  # Create Cart Tables
  
  1. New Tables
    - `carts`
      - `cart_id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `session_token` (text) - For guest carts
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `cart_items`
      - `cart_item_id` (uuid, primary key)
      - `cart_id` (uuid, references carts, required)
      - `listing_id` (uuid, references listings, required)
      - `sku_item_id` (uuid, references sku_items)
      - `quantity` (integer, required)
      - `price_at_add` (numeric, required) - Price when added to cart
      - `added_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Users can only access their own carts
    - Guest carts accessible by session token
    - Cart items cascade delete with cart
  
  3. Notes
    - Supports both logged-in users and guest sessions
    - Stores price at time of adding (for price change tracking)
*/

CREATE TABLE IF NOT EXISTS carts (
  cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  session_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT cart_user_or_session CHECK (
    (user_id IS NOT NULL AND session_token IS NULL) OR
    (user_id IS NULL AND session_token IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Users can access their own carts
CREATE POLICY "Users can access own carts"
  ON carts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can create guest carts
CREATE POLICY "Anyone can create guest carts"
  ON carts FOR INSERT
  TO public
  WITH CHECK (session_token IS NOT NULL);

-- Public can read carts by session token (for guest checkout)
CREATE POLICY "Guest carts accessible by session"
  ON carts FOR SELECT
  TO public
  USING (session_token IS NOT NULL);

CREATE TABLE IF NOT EXISTS cart_items (
  cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listings_id) ON DELETE CASCADE,
  sku_item_id UUID REFERENCES sku_items(sku_item_id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_add NUMERIC(10,2) NOT NULL,
  added_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Cart owners can manage their cart items
CREATE POLICY "Cart owners can manage cart items"
  ON cart_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE cart_id = cart_items.cart_id 
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE cart_id = cart_items.cart_id 
      AND user_id = auth.uid()
    )
  );

-- Public can manage guest cart items
CREATE POLICY "Guest cart items manageable"
  ON cart_items FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE cart_id = cart_items.cart_id 
      AND session_token IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE cart_id = cart_items.cart_id 
      AND session_token IS NOT NULL
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_token ON carts(session_token);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_listing_id ON cart_items(listing_id);
