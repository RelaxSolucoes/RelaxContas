import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { formatCurrency } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import MonthlyBalanceChart from '../components/Dashboard/MonthlyBalanceChart';
import AccountBalancePieChart from '../components/Dashboard/AccountBalancePieChart';
import IncomeByCategoryChart from '../components/Dashboard/IncomeByCategoryChart';
import TotalBalanceLineChart from '../components/Dashboard/TotalBalanceLineChart';
import QuickStatsCards from '../components/Dashboard/QuickStatsCards';
import { Transaction, Account, Category, Goal } from '../types';

// Definição de tipos para os dados do dashboard
interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  lastMonthIncome: number;
  lastMonthExpenses: number;
  expensesByCategory: any[];
  incomeByCategory: any[];
  recentTransactions: any[];
  monthlyTrends: any[];
  topExpenses: any[];
  topIncomes: any[];
  savingsRate: number;
  budgetProgress: any[];
  allTransactions: Transaction[];
  allAccounts: Account[];
  categories: Category[];
  goals: Goal[];
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<DashboardData>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    lastMonthIncome: 0,
    lastMonthExpenses: 0,
    expensesByCategory: [],
    incomeByCategory: [],
    recentTransactions: [],
    monthlyTrends: [],
    topExpenses: [],
    topIncomes: [],
    savingsRate: 0,
    budgetProgress: [],
    allTransactions: [],
    allAccounts: [],
    categories: [],
    goals: [],
  });

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get current month dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      
      // Get last month dates
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Fetch accounts for total balance
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      // Calculate total balance excluding credit accounts
      const totalBalance = accounts?.reduce((sum, account) => {
        if (account.type !== 'credit') {
          return sum + account.balance;
        }
        return sum;
      }, 0) || 0;

      // Fetch current month transactions
      const { data: currentMonthTransactions } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name,
            color
          )
        `)
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      // Fetch last month transactions
      const { data: lastMonthTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfLastMonth)
        .lte('date', endOfLastMonth);

      // Calculate monthly totals
      const monthlyIncome = currentMonthTransactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const monthlyExpenses = currentMonthTransactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const lastMonthIncome = lastMonthTransactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const lastMonthExpenses = lastMonthTransactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      // Calculate savings rate
      const savingsRate = monthlyIncome > 0 
        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
        : 0;

      // Group expenses by category
      const expensesByCategory = currentMonthTransactions
        ?.filter(t => t.type === 'expense')
        .reduce((acc, transaction) => {
          const categoryId = transaction.category_id;
          if (!acc[categoryId]) {
            acc[categoryId] = {
              category: transaction.categories,
              total: 0,
              count: 0,
            };
          }
          acc[categoryId].total += transaction.amount;
          acc[categoryId].count += 1;
          return acc;
        }, {});

      // Convert to array and calculate percentages
      const expenseCategories = Object.values(expensesByCategory || {})
        .map((group: any) => ({
          ...group,
          percentage: (group.total / monthlyExpenses) * 100,
        }))
        .sort((a: any, b: any) => b.total - a.total);

      // Get top expenses
      const topExpenses = currentMonthTransactions
        ?.filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5) || [];

      // Get top incomes
      const topIncomes = currentMonthTransactions
        ?.filter(t => t.type === 'income')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5) || [];

      // Get recent transactions
      const recentTransactions = currentMonthTransactions
        ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5) || [];

      // Fetch all transactions (para gráficos)
      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      // Fetch categories
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      // Fetch goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      setData({
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        lastMonthIncome,
        lastMonthExpenses,
        expensesByCategory: expenseCategories,
        recentTransactions,
        topExpenses,
        topIncomes,
        savingsRate,
        incomeByCategory: [],
        monthlyTrends: [],
        budgetProgress: [],
        allTransactions: allTransactions || [],
        allAccounts: accounts || [],
        categories: categories || [],
        goals: goals || [],
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  let incomeChangeLabel = '';
  if (data.lastMonthIncome === 0 && data.monthlyIncome > 0) {
    incomeChangeLabel = 'Novo';
  } else if (data.lastMonthIncome === 0 && data.monthlyIncome === 0) {
    incomeChangeLabel = '0%';
  } else {
    const pct = ((data.monthlyIncome - data.lastMonthIncome) / data.lastMonthIncome) * 100;
    incomeChangeLabel = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  }

  let expenseChangeLabel = '';
  if (data.lastMonthExpenses === 0 && data.monthlyExpenses > 0) {
    expenseChangeLabel = 'Novo';
  } else if (data.lastMonthExpenses === 0 && data.monthlyExpenses === 0) {
    expenseChangeLabel = '0%';
  } else {
    const pct = ((data.monthlyExpenses - data.lastMonthExpenses) / data.lastMonthExpenses) * 100;
    expenseChangeLabel = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white col-span-full">Dashboard</h1>
        {/* Saldo Total */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-medium text-gray-500 dark:text-white truncate">Saldo Total</h3>
            <span className="bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-white text-[11px] font-medium px-2 py-0.5 rounded-full">Total</span>
          </div>
          <p className="text-xl font-bold mt-1 truncate dark:text-white">{formatCurrency(data.totalBalance)}</p>
          <span className="text-xs text-gray-500 dark:text-white mt-2">Todas as contas</span>
        </div>

        {/* Receitas do Mês */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-300 truncate">Receitas do Mês</h3>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              incomeChangeLabel === 'Novo' || incomeChangeLabel.startsWith('+')
                ? 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300'
                : incomeChangeLabel.startsWith('-')
                  ? 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300'
            }`}>
              {incomeChangeLabel}
            </span>
          </div>
          <p className="text-xl font-bold mt-1 truncate dark:text-gray-100">{formatCurrency(data.monthlyIncome)}</p>
          <div className="flex items-center text-xs mt-2">
            <ArrowUpRight 
              size={14} 
              className={incomeChangeLabel.startsWith('+') ? 'text-green-500' : 'text-red-500'} 
            />
            <span className="text-gray-500 dark:text-gray-300 ml-1 truncate">
              vs. mês anterior ({formatCurrency(data.lastMonthIncome)})
            </span>
          </div>
        </div>

        {/* Despesas do Mês */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-300 truncate">Despesas do Mês</h3>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              expenseChangeLabel === 'Novo' || expenseChangeLabel.startsWith('-')
                ? 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300'
                : expenseChangeLabel.startsWith('+')
                  ? 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300'
            }`}>
              {expenseChangeLabel}
            </span>
          </div>
          <p className="text-xl font-bold mt-1 truncate dark:text-gray-100">{formatCurrency(data.monthlyExpenses)}</p>
          <div className="flex items-center text-xs mt-2">
            <ArrowDownRight 
              size={14} 
              className={expenseChangeLabel.startsWith('-') ? 'text-red-500' : 'text-green-500'} 
            />
            <span className="text-gray-500 dark:text-gray-300 ml-1 truncate">
              vs. mês anterior ({formatCurrency(data.lastMonthExpenses)})
            </span>
          </div>
        </div>

        {/* Taxa de Economia */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-300 truncate">Taxa de Economia</h3>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              data.savingsRate >= 20 
                ? 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300' 
                : data.savingsRate >= 10 
                  ? 'bg-yellow-50 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300' 
                  : 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300'
            }`}>
              {data.savingsRate >= 20 ? 'Ótimo' : data.savingsRate >= 10 ? 'Bom' : 'Atenção'}
            </span>
          </div>
          <p className="text-xl font-bold mt-1 truncate dark:text-gray-100">{data.savingsRate.toFixed(1)}%</p>
          <span className="text-xs text-gray-500 dark:text-gray-300 mt-2 truncate">Meta: 20% da renda</span>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <QuickStatsCards
        totalTransactions={data.allTransactions.length}
        avgDailyExpense={(() => {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const expenses = data.allTransactions.filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth && new Date(t.date) <= endOfMonth);
          const days = (endOfMonth.getDate() - startOfMonth.getDate() + 1) || 1;
          const total = expenses.reduce((sum, t) => sum + t.amount, 0);
          return total / days;
        })()}
        biggestExpense={(() => {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const expenses = data.allTransactions.filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth);
          return expenses.length > 0 ? Math.max(...expenses.map(t => t.amount)) : 0;
        })()}
        biggestIncome={(() => {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const incomes = data.allTransactions.filter(t => t.type === 'income' && new Date(t.date) >= startOfMonth);
          return incomes.length > 0 ? Math.max(...incomes.map(t => t.amount)) : 0;
        })()}
        activeAccounts={data.allAccounts.filter(a => a.isactive).length}
        activeGoals={data.goals.length}
      />

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyBalanceChart transactions={data.allTransactions} />
        <AccountBalancePieChart accounts={data.allAccounts} />
        <IncomeByCategoryChart transactions={data.allTransactions} categories={data.categories} />
        <TotalBalanceLineChart transactions={data.allTransactions} accounts={data.allAccounts} />
      </div>

      {/* Expenses by Category */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-6 dark:text-white">Despesas por Categoria</h2>
        <div className="space-y-4">
          {data.expensesByCategory.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full py-12">
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
              <p className="text-gray-500 dark:text-white text-lg font-medium">Nenhuma despesa encontrada neste mês</p>
              <p className="text-gray-400 dark:text-white text-sm mt-1">Adicione transações de despesa para visualizar este gráfico.</p>
            </div>
          ) : (
            data.expensesByCategory.map((category: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.category?.color }}
                    ></div>
                    <span className="text-sm font-medium dark:text-white">{category.category?.name}</span>
                  </div>
                  <span className="text-sm font-medium dark:text-white">{formatCurrency(category.total)}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${category.percentage}%`,
                      backgroundColor: category.category?.color 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-white mt-1">
                  <span>{category.count} transações</span>
                  <span>{category.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-6 dark:text-white">Balanço Mensal</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 dark:text-white">Maiores Despesas</h3>
            <div className="space-y-3">
              {data.topExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full py-8">
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-2"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
                  <p className="text-gray-500 text-base font-medium dark:text-white">Nenhuma despesa encontrada</p>
                  <p className="text-gray-400 text-xs mt-1">Adicione transações de despesa para visualizar aqui.</p>
                </div>
              ) : (
                data.topExpenses.map((transaction: any) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: transaction.categories?.color }}
                      ></div>
                      <span className="text-sm dark:text-white">{transaction.description}</span>
                    </div>
                    <span className="text-sm font-medium text-red-600 dark:text-white">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 dark:text-white">Maiores Receitas</h3>
            <div className="space-y-3">
              {data.topIncomes.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full py-8">
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-2"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
                  <p className="text-gray-500 text-base font-medium dark:text-white">Nenhuma receita encontrada</p>
                  <p className="text-gray-400 text-xs mt-1">Adicione transações de receita para visualizar aqui.</p>
                </div>
              ) : (
                data.topIncomes.map((transaction: any) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: transaction.categories?.color }}
                      ></div>
                      <span className="text-sm dark:text-white">{transaction.description}</span>
                    </div>
                    <span className="text-sm font-medium text-green-600 dark:text-white">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold dark:text-white">Transações Recentes</h2>
          <Link to="/transactions" className="text-blue-600 dark:text-white text-sm hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="space-y-4">
          {data.recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full py-12">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-2"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
              <p className="text-gray-500 dark:text-white text-base font-medium">Nenhuma transação encontrada</p>
              <p className="text-gray-400 dark:text-white text-xs mt-1">Adicione uma transação para visualizar aqui.</p>
            </div>
          ) : (
            data.recentTransactions.map((transaction: any) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: transaction.categories?.color || '#e2e8f0' }}
                  >
                    <span className="text-white text-xs">
                      {transaction.categories?.name?.substring(0, 2).toUpperCase() || 'TX'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{transaction.description}</p>
                    <div className="flex text-xs text-gray-500 dark:text-white">
                      <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className={transaction.type === 'income' ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                  {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;