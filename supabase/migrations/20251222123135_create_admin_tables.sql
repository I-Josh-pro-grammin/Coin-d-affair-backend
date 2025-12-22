/*
  # Create Admin Tables
  
  1. New Tables
    - `admin_logs`
      - `log_id` (serial, primary key)
      - `admin_user_id` (uuid, references users)
      - `action` (varchar, required) - Action performed
      - `resource_type` (varchar) - Type of resource (user, business, etc.)
      - `resource_id` (varchar) - ID of affected resource
      - `meta` (jsonb) - Additional metadata (IP, path, etc.)
      - `created_at` (timestamp)
    
    - `admin_notifications`
      - `notification_id` (serial, primary key)
      - `title` (varchar, required)
      - `body` (text)
      - `target_user_id` (uuid, references users)
      - `data` (jsonb) - Additional notification data
      - `is_read` (boolean, default false)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Only admins can access admin logs
    - Users can read their own notifications
    - Admins can manage all notifications
  
  3. Notes
    - Admin logs track all administrative actions
    - Notifications can be targeted to specific users or broadcast
*/

CREATE TABLE IF NOT EXISTS admin_logs (
  log_id SERIAL PRIMARY KEY,
  admin_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(255),
  resource_id VARCHAR(255),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin logs
CREATE POLICY "Admins can view admin logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Only admins can insert logs
CREATE POLICY "Admins can create logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() 
      AND account_type = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS admin_notifications (
  notification_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  target_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can view own notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = target_user_id OR
    target_user_id IS NULL
  );

-- Users can mark their notifications as read
CREATE POLICY "Users can update own notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = target_user_id)
  WITH CHECK (auth.uid() = target_user_id);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications"
  ON admin_notifications FOR ALL
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
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_target_user ON admin_notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
