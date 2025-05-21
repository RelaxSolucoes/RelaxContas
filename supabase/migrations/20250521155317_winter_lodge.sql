/*
  # Fix accounts table column names

  1. Changes
    - Rename closing_date to closingdate
    - Rename due_date to duedate
    - Rename credit_limit to creditlimit
    - Rename is_active to isactive

  2. Security
    - No changes to RLS policies
*/

DO $$
BEGIN
  -- Rename closing_date to closingdate if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'closing_date'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN closing_date TO closingdate;
  END IF;

  -- Rename due_date to duedate if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN due_date TO duedate;
  END IF;

  -- Rename credit_limit to creditlimit if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'credit_limit'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN credit_limit TO creditlimit;
  END IF;

  -- Rename is_active to isactive if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN is_active TO isactive;
  END IF;
END $$;