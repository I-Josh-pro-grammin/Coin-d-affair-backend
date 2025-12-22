/*
  # Create Users Table
  
  1. New Tables
    - `users`
      - `user_id` (uuid, primary key)
      - `email` (text, unique, required)
      - `phone` (text)
      - `password` (text, required)
      - `full_name` (text)
      - `is_verified` (boolean, default false)
      - `is_active` (boolean, default true)
      - `account_type` (enum: user, business, admin)
      - `verifytoken` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data
    - Add policy for users to update their own data
    - Add policy for admins to read all users
*/

-- Create account type enum
CREATE TYPE account_type AS ENUM ('user', 'business', 'admin');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  full_name TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  account_type account_type DEFAULT 'user',
  verifytoken TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can insert (for registration)
CREATE POLICY "Anyone can register"
  ON users FOR INSERT
  TO public
  WITH CHECK (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
