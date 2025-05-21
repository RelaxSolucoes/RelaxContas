import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { formatCurrency } from '../utils/helpers';
import { Filter, Download, ArrowUpRight, ArrowDownRight, PieChart, BarChart } from 'lucide-react';

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    transactions: [],
    categories: [],
    accounts: [],
  });
  
  // Filters
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    categoryId: '',
    accountId: '',
  });
  
  // Report type
  const [selectedReport, setSelectedReport] = useState<
    'expense-categories' | 'income-categories' | 'monthly-summary' | 'cash-flow'
  >('expense-categories');

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Build transaction query with filters
      let query = supabase
        .from('transactions')
        .select(`
          *,
          categories (
            id,
            name,
            color
          ),
          accounts (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .gte('date', filters.startDate)
        .lte('date', filters.endDate);

      if (filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }

      const { data: transactions, error: transactionsError } = await query;
      if (transactionsError) throw transactionsError;

      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);
      if (categoriesError) throw categoriesError;

      // Fetch accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);
      if (accountsError) throw accountsError;

      setData({
        transactions: transactions || [],
        categories: categories || [],
        accounts: accounts || [],
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totals = data.transactions.reduce(
    (acc, transaction: any) => {
      if (transaction.type === 'income') {
        acc.income += transaction.amount;
      } else {
        acc.expense += transaction.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const balance = totals.income - totals.expense;

  // Group transactions by category
  const groupByCategory = (type: 'income' | 'expense') => {
    const typeTransactions = data.transactions.filter((t: any) => t.type === type);
    const grouped = typeTransactions.reduce((acc: any, transaction: any) => {
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

    return Object.values(grouped)
      .map((group: any) => ({
        ...group,
        percentage: (group.total / (type === 'income' ? totals.income : totals.expense)) * 100,
      }))
      .sort((a: any, b: any) => b.total - a.total);
  };

  const expensesByCategory = groupByCategory('expense');
  const incomesByCategory = groupByCategory('income');

  // Format date for display
  const formatDateRange = () => {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        
        <div className="flex flex-wrap gap-2">
          {/* Date Range Filter */}
          <div className="flex items-center bg-white border border-gray-300 rounded-md overflow-hidden">
            <div className="px-3 py-2 bg-gray-100 border-r border-gray-300">
              <Filter size={18} className="text-gray-500" />
            </div>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="px-3 py-2 border-r border-gray-300"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="px-3 py-2"
            />
          </div>
          
          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
          
          {/* Category Filter */}
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({...filters, categoryId: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">Todas as categorias</option>
            {data.categories.map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          {/* Account Filter */}
          <select
            value={filters.accountId}
            onChange={(e) => setFilters({...filters, accountId: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">Todas as contas</option>
            {data.accounts.map((account: any) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setFilters({
              type: 'all',
              startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
              endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
              categoryId: '',
              accountId: '',
            })}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-md"
          >
            Limpar Filtros
          </button>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium">Saldo do Período</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">Total de Receitas</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.income)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 font-medium">Total de Despesas</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.expense)}</p>
        </div>
      </div>

      {/* Report Types */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setSelectedReport('expense-categories')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              selectedReport === 'expense-categories' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PieChart size={16} />
            Despesas por Categoria
          </button>
          <button 
            onClick={() => setSelectedReport('income-categories')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              selectedReport === 'income-categories' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PieChart size={16} />
            Receitas por Categoria
          </button>
          <button 
            onClick={() => setSelectedReport('monthly-summary')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              selectedReport === 'monthly-summary' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart size={16} />
            Resumo Mensal
          </button>
          <button 
            onClick={() => setSelectedReport('cash-flow')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              selectedReport === 'cash-flow' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart size={16} />
            Fluxo de Caixa
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedReport === 'expense-categories' && 'Despesas por Categoria'}
            {selectedReport === 'income-categories' && 'Receitas por Categoria'}
            {selectedReport === 'monthly-summary' && 'Resumo Mensal'}
            {selectedReport === 'cash-flow' && 'Fluxo de Caixa'}
          </h2>
          <span className="text-sm text-gray-500">{formatDateRange()}</span>
        </div>
        
        {selectedReport === 'expense-categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visualization */}
            <div className="flex justify-center items-center">
              {expensesByCategory.length > 0 ? (
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold">{formatCurrency(totals.expense)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Sem despesas no período selecionado</p>
                </div>
              )}
            </div>
            
            {/* Details */}
            <div>
              <div className="space-y-3">
                {expensesByCategory.map((group: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: group.category?.color }}
                      ></div>
                      <div>
                        <p className="font-medium">{group.category?.name || 'Sem categoria'}</p>
                        <p className="text-xs text-gray-500">{group.percentage.toFixed(1)}% do total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(group.total)}</p>
                      <p className="text-xs text-gray-500">{group.count} transações</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {expensesByCategory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Sem despesas no período selecionado</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {selectedReport === 'income-categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visualization */}
            <div className="flex justify-center items-center">
              {incomesByCategory.length > 0 ? (
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold">{formatCurrency(totals.income)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Sem receitas no período selecionado</p>
                </div>
              )}
            </div>
            
            {/* Details */}
            <div>
              <div className="space-y-3">
                {incomesByCategory.map((group: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: group.category?.color }}
                      ></div>
                      <div>
                        <p className="font-medium">{group.category?.name || 'Sem categoria'}</p>
                        <p className="text-xs text-gray-500">{group.percentage.toFixed(1)}% do total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(group.total)}</p>
                      <p className="text-xs text-gray-500">{group.count} transações</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {incomesByCategory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Sem receitas no período selecionado</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {selectedReport === 'monthly-summary' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Despesas Mensais</h3>
                
                <div className="space-y-4">
                  {expensesByCategory.slice(0, 5).map((group: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: group.category?.color }}
                          ></div>
                          <span className="text-sm font-medium">{group.category?.name}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(group.total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ 
                            width: `${group.percentage}%`,
                            backgroundColor: group.category?.color
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  
                  {expensesByCategory.length > 5 && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        + {expensesByCategory.length - 5} outras categorias
                      </p>
                    </div>
                  )}
                  
                  {expensesByCategory.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Sem despesas no período selecionado</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Receitas Mensais</h3>
                
                <div className="space-y-4">
                  {incomesByCategory.slice(0, 5).map((group: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: group.category?.color }}
                          ></div>
                          <span className="text-sm font-medium">{group.category?.name}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(group.total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ 
                            width: `${group.percentage}%`,
                            backgroundColor: group.category?.color
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  
                  {incomesByCategory.length > 5 && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        + {incomesByCategory.length - 5} outras categorias
                      </p>
                    </div>
                  )}
                  
                  {incomesByCategory.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Sem receitas no período selecionado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Resumo do Período</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total de Receitas</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(totals.income)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total de Despesas</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(totals.expense)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Balanço Final</p>
                    <p className={`text-xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">Taxa de Economia</p>
                    <p className="text-sm font-medium">
                      {totals.income > 0 ? Math.round((balance / totals.income) * 100) : 0}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ 
                        width: `${totals.income > 0 ? Math.max(0, Math.min(100, (balance / totals.income) * 100)) : 0}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {balance >= 0 
                      ? `Você economizou ${Math.round((balance / totals.income) * 100)}% da sua renda neste período`
                      : 'Suas despesas superaram suas receitas neste período'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedReport === 'cash-flow' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-full max-w-3xl">
                <div className="relative h-[300px] flex items-end">
                  <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gray-200"></div>
                  <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gray-200"></div>
                  
                  <div className="w-full flex h-4/5 items-end">
                    <div className="flex-1 flex flex-col items-center">
                      <div className="w-16 h-40 bg-green-500 rounded-t-md"></div>
                      <p className="text-sm mt-2">Receitas</p>
                      <p className="text-xs text-gray-500">{formatCurrency(totals.income)}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="w-16 h-24 bg-red-500 rounded-t-md"></div>
                      <p className="text-sm mt-2">Despesas</p>
                      <p className="text-xs text-gray-500">{formatCurrency(totals.expense)}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className={`w-16 ${balance >= 0 ? 'h-16 bg-blue-500' : 'h-8 bg-red-500'} rounded-t-md`}></div>
                      <p className="text-sm mt-2">Balanço</p>
                      <p className="text-xs text-gray-500">{formatCurrency(Math.abs(balance))}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">Maiores Receitas</h3>
                
                <div className="space-y-3">
                  {data.transactions
                    .filter((t: any) => t.type === 'income')
                    .sort((a: any, b: any) => b.amount - a.amount)
                    .slice(0, 5)
                    .map((transaction: any, index: number) => {
                      const category = transaction.categories;
                      
                      return (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: category?.color }}
                            ></div>
                            <span className="text-sm">{transaction.description}</span>
                          </div>
                          <span className="font-medium text-green-600">{formatCurrency(transaction.amount)}</span>
                        </div>
                      );
                    })}
                  
                  {data.transactions.filter((t: any) => t.type === 'income').length === 0 && (
                    <p className="text-center text-gray-500 py-4">Sem receitas no período</p>
                  )}
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">Maiores Despesas</h3>
                
                <div className="space-y-3">
                  {data.transactions
                    .filter((t: any) => t.type === 'expense')
                    .sort((a: any, b: any) => b.amount - a.amount)
                    .slice(0, 5)
                    .map((transaction: any, index: number) => {
                      const category = transaction.categories;
                      
                      return (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: category?.color }}
                            ></div>
                            <span className="text-sm">{transaction.description}</span>
                          </div>
                          <span className="font-medium text-red-600">{formatCurrency(transaction.amount)}</span>
                        </div>
                      );
                    })}
                  
                  {data.transactions.filter((t: any) => t.type === 'expense').length === 0 && (
                    <p className="text-center text-gray-500 py-4">Sem despesas no período</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;