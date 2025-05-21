/*
  # Add user profile fields
  
  1. Changes
    - Add name and phone fields to users table
    - Update RLS policies
*/

ALTER TABLE users
ADD COLUMN IF NOT EXISTS name text NOT NULL,
ADD COLUMN IF NOT EXISTS phone text;

-- Update the policy to include the new fields
DROP POLICY IF EXISTS "Users can manage their own profile" ON users;
CREATE POLICY "Users can manage their own profile"
  ON users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);