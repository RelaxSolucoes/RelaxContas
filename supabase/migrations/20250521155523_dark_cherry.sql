/*
  # Fix accounts table column names

  1. Changes
    - Rename columns to match frontend naming convention:
      - is_active -> isactive
      - credit_limit -> creditlimit
      - due_date -> duedate
      - closing_date -> closingdate

  2. Notes
    - Uses conditional checks to prevent errors if columns already renamed
    - Preserves existing data
*/

DO $$
BEGIN
  -- Rename columns if they exist with old names
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN is_active TO isactive;
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
    WHERE table_name = 'accounts' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN due_date TO duedate;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'closing_date'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN closing_date TO closingdate;
  END IF;
END $$;