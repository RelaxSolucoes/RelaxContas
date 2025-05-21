export interface Transaction {
  id: string;
  user_id?: string;
  account_id: string;
  category_id?: string;
  subcategory_id?: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  notes?: string;
  tags?: string[];
  recurring?: boolean;
  recurring_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  balance: number;
  currency: string;
  color?: string;
  isactive: boolean;
  creditlimit?: number;
  duedate?: number;
  closingdate?: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

export interface Budget {
  id: string;
  category_id: string;
  subcategory_id?: string;
  amount: number;
  period: 'monthly' | 'yearly';
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  color?: string;
}