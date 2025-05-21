/*
  # Update Account Balance Trigger

  1. Changes
    - Add trigger function to update account balance on transaction insert/update/delete
    - Add trigger to transactions table
    
  2. Security
    - No direct table modifications, only through trigger
    - Maintains data consistency between transactions and accounts
*/

-- Function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- For new transactions (INSERT)
  IF (TG_OP = 'INSERT') THEN
    IF NEW.type = 'income' THEN
      -- Add amount to account balance for income
      UPDATE accounts 
      SET balance = balance + NEW.amount
      WHERE id = NEW.account_id;
    ELSE
      -- Subtract amount from account balance for expense
      UPDATE accounts 
      SET balance = balance - NEW.amount
      WHERE id = NEW.account_id;
    END IF;
    
  -- For updated transactions (UPDATE)
  ELSIF (TG_OP = 'UPDATE') THEN
    -- First reverse the old transaction
    IF OLD.type = 'income' THEN
      UPDATE accounts 
      SET balance = balance - OLD.amount
      WHERE id = OLD.account_id;
    ELSE
      UPDATE accounts 
      SET balance = balance + OLD.amount
      WHERE id = OLD.account_id;
    END IF;
    
    -- Then apply the new transaction
    IF NEW.type = 'income' THEN
      UPDATE accounts 
      SET balance = balance + NEW.amount
      WHERE id = NEW.account_id;
    ELSE
      UPDATE accounts 
      SET balance = balance - NEW.amount
      WHERE id = NEW.account_id;
    END IF;
    
  -- For deleted transactions (DELETE)
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.type = 'income' THEN
      UPDATE accounts 
      SET balance = balance - OLD.amount
      WHERE id = OLD.account_id;
    ELSE
      UPDATE accounts 
      SET balance = balance + OLD.amount
      WHERE id = OLD.account_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS update_account_balance_trigger ON transactions;
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();