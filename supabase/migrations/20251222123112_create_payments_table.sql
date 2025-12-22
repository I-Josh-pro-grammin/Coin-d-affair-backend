/*
  # Create Payments Table
  
  1. New Tables
    - `payments`
      - `payment_id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `user_id` (uuid, references users)
      - `provider` (text) - Payment provider (stripe, etc.)
      - `provider_payment_id` (text) - External payment ID
      - `amount` (numeric, required)
      - `currency` (text, default 'USD')
      - `status` (text, default 'pending')
      - `recipient_type` (text) - 'business' or 'platform'
      - `recipient_id` (uuid) - Business or platform ID
      - `metadata` (jsonb) - Additional payment data
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on payments table
    - Users can view their own payments
    - Business owners can view payments to their business
    - Admins can view all payments
  
  3. Notes
    - Supports multiple payment providers
    - Status: pending, success, failed, refunded
    - Tracks recipient (business or platform)
*/

CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  recipient_type TEXT,
  recipient_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Business owners can view payments to their business
CREATE POLICY "Business owners can view their payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    recipient_type = 'business' AND
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE business_id = recipient_id 
      AND user_id = auth.uid()
    )
  );

-- System can insert payments
CREATE POLICY "Authenticated can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- System can update payment status
CREATE POLICY "Authenticated can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider, provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_recipient ON payments(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
