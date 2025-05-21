import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Transaction, 
  Account, 
  Category, 
  Budget, 
  Goal, 
  Debt,
  Subcategory
} from '../types';
import { generateDefaultCategories } from '../utils/defaultData';
import { generateId } from '../utils/helpers';

interface AppContextType {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, subcategory: Omit<Subcategory, 'id' | 'categoryId'>) => void;
  updateSubcategory: (subcategory: Subcategory) => void;
  deleteSubcategory: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  updateDebt: (debt: Debt) => void;
  deleteDebt: (id: string) => void;
  getAccountBalance: (accountId: string) => number;
  getTotalBalance: () => number;
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getCurrentMonthIncome: () => number;
  getCurrentMonthExpenses: () => number;
  getBudgetProgress: (budgetId: string) => { spent: number; remaining: number; percentage: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const storedData = localStorage.getItem('transactions');
    return storedData ? JSON.parse(storedData) : [];
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const storedData = localStorage.getItem('accounts');
    return storedData ? JSON.parse(storedData) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const storedData = localStorage.getItem('categories');
    return storedData ? JSON.parse(storedData) : generateDefaultCategories();
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const storedData = localStorage.getItem('budgets');
    return storedData ? JSON.parse(storedData) : [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const storedData = localStorage.getItem('goals');
    return storedData ? JSON.parse(storedData) : [];
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    const storedData = localStorage.getItem('debts');
    return storedData ? JSON.parse(storedData) : [];
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('debts', JSON.stringify(debts));
  }, [debts]);

  // Transaction functions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: generateId() };
    setTransactions([...transactions, newTransaction]);
  };

  const updateTransaction = (transaction: Transaction) => {
    setTransactions(transactions.map(t => t.id === transaction.id ? transaction : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Account functions
  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount = { ...account, id: generateId() };
    setAccounts([...accounts, newAccount]);
  };

  const updateAccount = (account: Account) => {
    setAccounts(accounts.map(a => a.id === account.id ? account : a));
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  // Category functions
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: generateId(), subcategories: [] };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (category: Category) => {
    setCategories(categories.map(c => c.id === category.id ? category : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  // Subcategory functions
  const addSubcategory = (categoryId: string, subcategory: Omit<Subcategory, 'id' | 'categoryId'>) => {
    const newSubcategory = { ...subcategory, id: generateId(), categoryId };
    setCategories(categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          subcategories: [...(c.subcategories || []), newSubcategory]
        };
      }
      return c;
    }));
  };

  const updateSubcategory = (subcategory: Subcategory) => {
    setCategories(categories.map(c => {
      if (c.id === subcategory.categoryId) {
        return {
          ...c,
          subcategories: c.subcategories?.map(s => 
            s.id === subcategory.id ? subcategory : s
          )
        };
      }
      return c;
    }));
  };

  const deleteSubcategory = (id: string) => {
    setCategories(categories.map(c => {
      return {
        ...c,
        subcategories: c.subcategories?.filter(s => s.id !== id)
      };
    }));
  };

  // Budget functions
  const addBudget = (budget: Omit<Budget, 'id'>) => {
    const newBudget = { ...budget, id: generateId() };
    setBudgets([...budgets, newBudget]);
  };

  const updateBudget = (budget: Budget) => {
    setBudgets(budgets.map(b => b.id === budget.id ? budget : b));
  };

  const deleteBudget = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id));
  };

  // Goal functions
  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal = { ...goal, id: generateId() };
    setGoals([...goals, newGoal]);
  };

  const updateGoal = (goal: Goal) => {
    setGoals(goals.map(g => g.id === goal.id ? goal : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  // Debt functions
  const addDebt = (debt: Omit<Debt, 'id'>) => {
    const newDebt = { ...debt, id: generateId() };
    setDebts([...debts, newDebt]);
  };

  const updateDebt = (debt: Debt) => {
    setDebts(debts.map(d => d.id === debt.id ? debt : d));
  };

  const deleteDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  // Utility functions
  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.balance || 0;
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => {
      // Don't include credit accounts in total balance
      if (account.type !== 'credit') {
        return total + account.balance;
      }
      return total;
    }, 0);
  };

  const getTransactionsByAccount = (accountId: string) => {
    return transactions.filter(t => t.accountId === accountId);
  };

  const getTransactionsByCategory = (categoryId: string) => {
    return transactions.filter(t => t.categoryId === categoryId);
  };

  const getTransactionsByDateRange = (startDate: string, endDate: string) => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      let start = startDate;
      let end = endDate;
      if (typeof startDate === 'string' && startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [sy, sm, sd] = startDate.split('-').map(Number);
        start = new Date(sy, sm - 1, sd);
      }
      if (typeof endDate === 'string' && endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ey, em, ed] = endDate.split('-').map(Number);
        end = new Date(ey, em - 1, ed);
      }
      return transactionDate >= start && transactionDate <= end;
    });
  };

  const getCurrentMonthIncome = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    return getTransactionsByDateRange(startOfMonth, endOfMonth)
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getCurrentMonthExpenses = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    return getTransactionsByDateRange(startOfMonth, endOfMonth)
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBudgetProgress = (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) {
      return { spent: 0, remaining: 0, percentage: 0 };
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (budget.period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else { // yearly
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }

    const relevantTransactions = getTransactionsByDateRange(
      startDate.toISOString(), 
      endDate.toISOString()
    ).filter(t => {
      // Match by category and optionally subcategory
      if (t.categoryId !== budget.categoryId) return false;
      if (budget.subcategoryId && t.subcategoryId !== budget.subcategoryId) return false;
      return t.type === 'expense';
    });

    const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = Math.max(0, budget.amount - spent);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    return { spent, remaining, percentage: Math.min(percentage, 100) };
  };

  const value = {
    transactions,
    accounts,
    categories,
    budgets,
    goals,
    debts,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addBudget,
    updateBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    addDebt,
    updateDebt,
    deleteDebt,
    getAccountBalance,
    getTotalBalance,
    getTransactionsByAccount,
    getTransactionsByCategory,
    getTransactionsByDateRange,
    getCurrentMonthIncome,
    getCurrentMonthExpenses,
    getBudgetProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};