/*
  # Fix accounts table column names

  1. Changes
    - Rename closing_date to closingdate
    - Rename due_date to duedate
    - Rename credit_limit to creditlimit
    - Rename is_active to isactive
*/

DO $$
BEGIN
  -- Rename columns if they exist with old names
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'closing_date'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN closing_date TO closingdate;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN due_date TO duedate;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'credit_limit'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN credit_limit TO creditlimit;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN is_active TO isactive;
  END IF;
END $$;