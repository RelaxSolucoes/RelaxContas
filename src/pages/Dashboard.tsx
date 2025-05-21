import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { formatCurrency } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Saldo Total</h3>
              <p className="text-2xl font-bold mt-1">{formatCurrency(data.totalBalance)}</p>
            </div>
            <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Total
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-gray-500">Todas as contas</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Receitas do Mês</h3>
              <p className="text-2xl font-bold mt-1">{formatCurrency(data.monthlyIncome)}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              incomeChangeLabel === 'Novo' || incomeChangeLabel.startsWith('+')
                ? 'bg-green-50 text-green-600'
                : incomeChangeLabel.startsWith('-')
                  ? 'bg-red-50 text-red-600'
                  : 'bg-gray-100 text-gray-500'
            }`}>
              {incomeChangeLabel}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <ArrowUpRight 
              size={16} 
              className={incomeChangeLabel.startsWith('+') ? 'text-green-500' : 'text-red-500'} 
            />
            <span className="text-gray-500 ml-1">
              vs. mês anterior ({formatCurrency(data.lastMonthIncome)})
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Despesas do Mês</h3>
              <p className="text-2xl font-bold mt-1">{formatCurrency(data.monthlyExpenses)}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              expenseChangeLabel === 'Novo' || expenseChangeLabel.startsWith('-')
                ? 'bg-red-50 text-red-600'
                : expenseChangeLabel.startsWith('+')
                  ? 'bg-green-50 text-green-600'
                  : 'bg-gray-100 text-gray-500'
            }`}>
              {expenseChangeLabel}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <ArrowDownRight 
              size={16} 
              className={expenseChangeLabel.startsWith('-') ? 'text-red-500' : 'text-green-500'} 
            />
            <span className="text-gray-500 ml-1">
              vs. mês anterior ({formatCurrency(data.lastMonthExpenses)})
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Taxa de Economia</h3>
              <p className="text-2xl font-bold mt-1">{data.savingsRate.toFixed(1)}%</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              data.savingsRate >= 20 
                ? 'bg-green-50 text-green-600' 
                : data.savingsRate >= 10 
                  ? 'bg-yellow-50 text-yellow-600' 
                  : 'bg-red-50 text-red-600'
            }`}>
              {data.savingsRate >= 20 ? 'Ótimo' : data.savingsRate >= 10 ? 'Bom' : 'Atenção'}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-gray-500">
              Meta: 20% da renda
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Despesas por Categoria</h2>
          
          <div className="space-y-4">
            {data.expensesByCategory.map((category: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.category?.color }}
                    ></div>
                    <span className="text-sm font-medium">{category.category?.name}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(category.total)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${category.percentage}%`,
                      backgroundColor: category.category?.color 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{category.count} transações</span>
                  <span>{category.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Maiores Transações</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Maiores Despesas</h3>
              <div className="space-y-3">
                {data.topExpenses.map((transaction: any) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: transaction.categories?.color }}
                      ></div>
                      <span className="text-sm">{transaction.description}</span>
                    </div>
                    <span className="text-sm font-medium text-red-600">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Maiores Receitas</h3>
              <div className="space-y-3">
                {data.topIncomes.map((transaction: any) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: transaction.categories?.color }}
                      ></div>
                      <span className="text-sm">{transaction.description}</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Transações Recentes</h2>
          <Link to="/transactions" className="text-blue-600 text-sm hover:underline">
            Ver todas
          </Link>
        </div>

        <div className="space-y-4">
          {data.recentTransactions.map((transaction: any) => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
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
                  <p className="font-medium text-gray-800">{transaction.description}</p>
                  <div className="flex text-xs text-gray-500">
                    <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              
              <div className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;