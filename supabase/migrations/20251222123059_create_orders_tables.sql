/*
  # Create Orders Tables
  
  1. New Tables
    - `orders`
      - `order_id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `seller_id` (uuid, references users)
      - `total_amount` (numeric, required)
      - `currency` (text, default 'USD')
      - `status` (text, default 'pending')
      - `shipping_address_id` (uuid, references addresses)
      - `billing_address_id` (uuid, references addresses)
      - `is_guest` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `order_items`
      - `order_item_id` (uuid, primary key)
      - `order_id` (uuid, references orders, required)
      - `listing_id` (uuid, references listings, required)
      - `sku_item_id` (uuid, references sku_items)
      - `quantity` (integer, required)
      - `unit_price` (numeric, required)
      - `total_price` (numeric, required)
  
  2. Security
    - Enable RLS on both tables
    - Users can view their own orders (as buyer or seller)
    - Admins can view all orders
    - Order status can be updated by seller or admin
  
  3. Notes
    - Supports guest orders
    - Status: pending, processing, shipped, delivered, cancelled
    - Tracks both buyer and seller
*/

CREATE TABLE IF NOT EXISTS orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  shipping_address_id UUID REFERENCES addresses(address_id) ON DELETE SET NULL,
  billing_address_id UUID REFERENCES addresses(address_id) ON DELETE SET NULL,
  is_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own orders
CREATE POLICY "Buyers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Sellers can view orders for their products
CREATE POLICY "Sellers can view their sales"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Users can create orders
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_guest = true);

-- Sellers and admins can update order status
CREATE POLICY "Sellers can update their orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = seller_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listings_id) ON DELETE RESTRICT,
  sku_item_id UUID REFERENCES sku_items(sku_item_id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Order owners can view their order items
CREATE POLICY "Order owners can view items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE order_id = order_items.order_id 
      AND (user_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Users can insert order items when creating orders
CREATE POLICY "Users can add order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE order_id = order_items.order_id 
      AND user_id = auth.uid()
    )
  );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_listing_id ON order_items(listing_id);
