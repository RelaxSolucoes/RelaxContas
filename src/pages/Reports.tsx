import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { formatCurrency } from '../utils/helpers';
import { Filter, Download, ArrowUpRight, ArrowDownRight, PieChart, BarChart } from 'lucide-react';
import { Transaction, Category, Account } from '../types';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Line, Legend } from 'recharts';

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    transactions: Transaction[];
    categories: Category[];
    accounts: Account[];
  }>({
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
    // Parse manual para evitar problemas de timezone
    const [startYear, startMonth, startDay] = filters.startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = filters.endDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Receitas */}
        <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-xl shadow p-4">
          <div className="bg-green-100 text-green-600 rounded-full p-2">
            <ArrowUpRight size={28} />
          </div>
          <div>
            <div className="text-xs text-green-700 font-semibold uppercase">Receitas</div>
            <div className="text-xl font-bold text-green-900">{formatCurrency(totals.income)}</div>
          </div>
        </div>
        {/* Despesas */}
        <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-xl shadow p-4">
          <div className="bg-red-100 text-red-600 rounded-full p-2">
            <ArrowDownRight size={28} />
          </div>
          <div>
            <div className="text-xs text-red-700 font-semibold uppercase">Despesas</div>
            <div className="text-xl font-bold text-red-900">{formatCurrency(totals.expense)}</div>
          </div>
        </div>
        {/* Saldo */}
        <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-xl shadow p-4">
          <div className="bg-blue-100 text-blue-600 rounded-full p-2">
            <PieChart size={28} />
          </div>
          <div>
            <div className="text-xs text-blue-700 font-semibold uppercase">Saldo</div>
            <div className="text-xl font-bold text-blue-900">{formatCurrency(balance)}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mt-2 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center w-full">
          {/* Date Range Filter */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden h-11">
            <div className="px-3 py-2 bg-gray-100 border-r border-gray-200 flex items-center h-full">
              <Filter size={18} className="text-gray-500" />
            </div>
            <input
              type="date"
              value={filters.startDate}
              max={filters.endDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="px-3 py-2 bg-transparent outline-none border-r border-gray-200 focus:bg-blue-50 transition h-full min-w-[120px]"
            />
            <input
              type="date"
              value={filters.endDate}
              min={filters.startDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="px-3 py-2 bg-transparent outline-none focus:bg-blue-50 transition h-full min-w-[120px]"
            />
          </div>
          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="px-3 h-11 border border-gray-200 rounded-lg bg-white focus:bg-blue-50 outline-none transition min-w-[150px]"
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
          {/* Filtros de categoria e conta só nas abas de categoria */}
          {(selectedReport === 'expense-categories' || selectedReport === 'income-categories') && (
            <>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({...filters, categoryId: e.target.value})}
                className="px-3 h-11 border border-gray-200 rounded-lg bg-white focus:bg-blue-50 outline-none transition min-w-[170px]"
          >
            <option value="">Todas as categorias</option>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select
            value={filters.accountId}
            onChange={(e) => setFilters({...filters, accountId: e.target.value})}
                className="px-3 h-11 border border-gray-200 rounded-lg bg-white focus:bg-blue-50 outline-none transition min-w-[150px]"
          >
            <option value="">Todas as contas</option>
                {data.accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
            </>
          )}
        </div>
        <div className="flex gap-2 w-full justify-end mt-4">
          <button
            onClick={() => setFilters({
              type: 'all',
              startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
              endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
              categoryId: '',
              accountId: '',
            })}
            className="flex items-center gap-2 px-5 h-11 rounded-lg border border-blue-500 text-blue-700 bg-white font-semibold shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-150"
          >
            <Filter size={16} /> Limpar Filtros
          </button>
          <button className="flex items-center gap-2 px-5 h-11 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-150">
            <Download size={16} /> Exportar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Gráfico de Pizza */}
            <div className="flex justify-center items-center">
              {data.categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full py-12">
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
                  <p className="text-gray-500 text-lg font-medium">Nenhuma categoria cadastrada</p>
                  <p className="text-gray-400 text-sm mt-1">Adicione categorias para visualizar este relatório.</p>
                </div>
              ) : expensesByCategory.length > 0 ? (
                <div className="relative w-72 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={expensesByCategory}
                        dataKey="total"
                        nameKey="category.name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        stroke="#fff"
                        strokeWidth={3}
                        labelLine={false}
                      >
                        {expensesByCategory.map((group, idx) => (
                          <Cell key={idx} fill={group.category?.color || '#60a5fa'} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload || !payload[0]) return null;
                        const entry = payload[0];
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span style={{ background: entry.color, width: 12, height: 12, borderRadius: 6, display: 'inline-block' }}></span>
                              <span className="font-semibold text-gray-700">{entry.name}</span>
                            </div>
                            <div className="text-gray-600 text-sm">{Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                        );
                      }} />
                    </RePieChart>
                  </ResponsiveContainer>
                  {/* Valor total centralizado */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-gray-500">Total</span>
                    <span className="text-2xl font-bold text-gray-800">{formatCurrency(totals.expense)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Sem despesas no período selecionado</p>
                </div>
              )}
            </div>
            {/* Lista de Categorias */}
              <div className="space-y-3">
              {data.categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full py-12">
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
                  <p className="text-gray-500 text-lg font-medium">Nenhuma categoria cadastrada</p>
                  <p className="text-gray-400 text-sm mt-1">Adicione categorias para visualizar este relatório.</p>
                </div>
              ) : expensesByCategory.map((group, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 shadow-sm hover:bg-blue-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: group.category?.color || '#60a5fa', display: 'inline-block' }}></span>
                      <div>
                      <span className="font-semibold text-gray-800">{group.category?.name || 'Sem categoria'}</span>
                      <span className="ml-2 text-xs text-gray-500">{group.percentage.toFixed(1)}% do total</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{formatCurrency(group.total)}</span>
                    <div className="text-xs text-gray-500">{group.count} transaç{group.count === 1 ? 'ão' : 'ões'}</div>
                    </div>
                  </div>
                ))}
              {data.categories.length === 0 ? null : expensesByCategory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Sem despesas no período selecionado</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {selectedReport === 'income-categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Gráfico de Pizza */}
            <div className="flex justify-center items-center">
              {data.categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full py-12">
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
                  <p className="text-gray-500 text-lg font-medium">Nenhuma categoria cadastrada</p>
                  <p className="text-gray-400 text-sm mt-1">Adicione categorias para visualizar este relatório.</p>
                </div>
              ) : incomesByCategory.length > 0 ? (
                <div className="relative w-72 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={incomesByCategory}
                        dataKey="total"
                        nameKey="category.name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        stroke="#fff"
                        strokeWidth={3}
                        labelLine={false}
                      >
                        {incomesByCategory.map((group, idx) => (
                          <Cell key={idx} fill={group.category?.color || '#60a5fa'} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload || !payload[0]) return null;
                        const entry = payload[0];
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span style={{ background: entry.color, width: 12, height: 12, borderRadius: 6, display: 'inline-block' }}></span>
                              <span className="font-semibold text-gray-700">{entry.name}</span>
                            </div>
                            <div className="text-gray-600 text-sm">{Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                        );
                      }} />
                    </RePieChart>
                  </ResponsiveContainer>
                  {/* Valor total centralizado */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-gray-500">Total</span>
                    <span className="text-2xl font-bold text-gray-800">{formatCurrency(totals.income)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Sem receitas no período selecionado</p>
                </div>
              )}
            </div>
            {/* Lista de Categorias */}
              <div className="space-y-3">
              {data.categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full py-12">
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
                  <p className="text-gray-500 text-lg font-medium">Nenhuma categoria cadastrada</p>
                  <p className="text-gray-400 text-sm mt-1">Adicione categorias para visualizar este relatório.</p>
                </div>
              ) : incomesByCategory.map((group, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 shadow-sm hover:bg-blue-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: group.category?.color || '#60a5fa', display: 'inline-block' }}></span>
                      <div>
                      <span className="font-semibold text-gray-800">{group.category?.name || 'Sem categoria'}</span>
                      <span className="ml-2 text-xs text-gray-500">{group.percentage.toFixed(1)}% do total</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{formatCurrency(group.total)}</span>
                    <div className="text-xs text-gray-500">{group.count} transaç{group.count === 1 ? 'ão' : 'ões'}</div>
                    </div>
                  </div>
                ))}
              {data.categories.length === 0 ? null : incomesByCategory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Sem receitas no período selecionado</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {selectedReport === 'monthly-summary' && (
          (() => {
            // Gera os últimos 6 meses
            const now = new Date();
            const months = Array.from({ length: 6 }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
              return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }) };
            });
            const hasData = data.transactions.some(t => t.type === 'income' || t.type === 'expense');
            if (!hasData) {
              return (
                <div className="flex flex-col items-center justify-center w-full py-16">
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
                  <p className="text-gray-500 text-lg font-medium">Nenhum dado encontrado</p>
                  <p className="text-gray-400 text-sm mt-1">Adicione receitas ou despesas para visualizar o resumo mensal.</p>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Gráfico de Barras */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Balanço Mensal</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ReBarChart data={months.map(({ year, month, label }) => {
                      const monthTransactions = data.transactions.filter(t => {
                        const d = new Date(t.date);
                        return d.getFullYear() === year && d.getMonth() === month;
                      });
                      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                      const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                      return {
                        name: label,
                        Receitas: income,
                        Despesas: expense,
                        Saldo: income - expense,
                      };
                    })} margin={{ top: 20, right: 40, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 14, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 14, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} tickFormatter={v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload) return null;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow p-3">
                            <div className="font-semibold text-gray-700 mb-1">{label}</div>
                            {payload.map((entry, i) => (
                              <div key={i} className="flex items-center gap-2 mb-1">
                                <span style={{ background: entry.color, width: 10, height: 10, borderRadius: 5, display: 'inline-block' }}></span>
                                <span className="text-sm text-gray-600">{entry.name}:</span>
                                <span className="font-bold" style={{ color: entry.color }}>{typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
                    </div>
                  ))}
                    </div>
                        );
                      }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} formatter={(value) => <span style={{ color: '#334155', fontWeight: 500, fontSize: 14 }}>{value}</span>} />
                      <Bar dataKey="Receitas" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={28} />
                      <Bar dataKey="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={28} />
                      <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} strokeDasharray="5 2" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
                {/* Cards de Totais e Taxa de Economia */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col items-center">
                      <span className="text-xs text-green-700 font-semibold uppercase">Receitas</span>
                      <span className="text-xl font-bold text-green-900">{formatCurrency(totals.income)}</span>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col items-center">
                      <span className="text-xs text-red-700 font-semibold uppercase">Despesas</span>
                      <span className="text-xl font-bold text-red-900">{formatCurrency(totals.expense)}</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col items-center">
                      <span className="text-xs text-blue-700 font-semibold uppercase">Balanço Final</span>
                      <span className={`text-xl font-bold ${balance >= 0 ? 'text-blue-900' : 'text-red-700'}`}>{formatCurrency(balance)}</span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Taxa de Economia</span>
                      <span className="text-sm font-semibold text-gray-800">{totals.income > 0 ? Math.round((balance / totals.income) * 100) : 0}%</span>
                  </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${totals.income > 0 ? Math.max(0, Math.min(100, (balance / totals.income) * 100)) : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {balance >= 0 
                      ? `Você economizou ${Math.round((balance / totals.income) * 100)}% da sua renda neste período`
                        : 'Suas despesas superaram suas receitas neste período'}
                  </p>
                  </div>
                </div>
              </div>
            );
          })()
        )}
        
        {selectedReport === 'cash-flow' && (
          (() => {
            // Gera os últimos 6 meses
            const now = new Date();
            const months = Array.from({ length: 6 }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
              return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }) };
            });
            const cashFlowData = months.map(({ year, month, label }) => {
              const monthTransactions = data.transactions.filter(t => {
                const d = new Date(t.date);
                return d.getFullYear() === year && d.getMonth() === month;
              });
              const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
              const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
              return {
                name: label,
                Receitas: income,
                Despesas: expense,
                Saldo: income - expense,
              };
            });
            const hasData = data.transactions.some(t => t.type === 'income' || t.type === 'expense');
            if (!hasData) {
              return (
                <div className="flex flex-col items-center justify-center w-full py-16">
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
                  <p className="text-gray-500 text-lg font-medium">Nenhum dado encontrado</p>
                  <p className="text-gray-400 text-sm mt-1">Adicione receitas ou despesas para visualizar o fluxo de caixa.</p>
                </div>
              );
            }
            // Maiores receitas e despesas do período filtrado
            const topIncomes = data.transactions
              .filter(t => t.type === 'income')
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5);
            const topExpenses = data.transactions
              .filter(t => t.type === 'expense')
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5);
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Gráfico de Barras Agrupadas */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Fluxo de Caixa</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ReBarChart data={cashFlowData} margin={{ top: 20, right: 40, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 14, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 14, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} tickFormatter={v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload) return null;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow p-3">
                            <div className="font-semibold text-gray-700 mb-1">{label}</div>
                            {payload.map((entry, i) => (
                              <div key={i} className="flex items-center gap-2 mb-1">
                                <span style={{ background: entry.color, width: 10, height: 10, borderRadius: 5, display: 'inline-block' }}></span>
                                <span className="text-sm text-gray-600">{entry.name}:</span>
                                <span className="font-bold" style={{ color: entry.color }}>{typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
                    </div>
                            ))}
                    </div>
                        );
                      }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} formatter={(value) => <span style={{ color: '#334155', fontWeight: 500, fontSize: 14 }}>{value}</span>} />
                      <Bar dataKey="Receitas" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={28} />
                      <Bar dataKey="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={28} />
                      <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} strokeDasharray="5 2" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
                {/* Cards de Maiores Receitas e Despesas */}
                <div className="flex flex-col gap-6 w-full">
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow">
                    <h4 className="font-medium text-gray-800 mb-3">Maiores Receitas</h4>
                    <div className="space-y-2">
                      {topIncomes.length === 0 && <p className="text-gray-500 text-sm">Sem receitas no período</p>}
                      {topIncomes.map((transaction, idx) => {
                        let catColor = '#22c55e';
                        const cat = transaction.category_id ? data.categories.find(c => c.id === transaction.category_id) : undefined;
                        if (cat && cat.color) catColor = cat.color;
                        return (
                          <div key={idx} className="flex items-center justify-between py-1 px-2 rounded hover:bg-green-50 transition">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: catColor, display: 'inline-block' }}></span>
                              <span className="text-sm font-medium text-gray-700">{transaction.description}</span>
                              <span className="text-xs text-gray-400 ml-2">{transaction.date && new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
              </div>
                            <span className="font-semibold text-green-700">{formatCurrency(transaction.amount)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow">
                    <h4 className="font-medium text-gray-800 mb-3">Maiores Despesas</h4>
                    <div className="space-y-2">
                      {topExpenses.length === 0 && <p className="text-gray-500 text-sm">Sem despesas no período</p>}
                      {topExpenses.map((transaction, idx) => {
                        let catColor = '#ef4444';
                        const cat = transaction.category_id ? data.categories.find(c => c.id === transaction.category_id) : undefined;
                        if (cat && cat.color) catColor = cat.color;
                      return (
                          <div key={idx} className="flex items-center justify-between py-1 px-2 rounded hover:bg-red-50 transition">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: catColor, display: 'inline-block' }}></span>
                              <span className="text-sm font-medium text-gray-700">{transaction.description}</span>
                              <span className="text-xs text-gray-400 ml-2">{transaction.date && new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <span className="font-semibold text-red-700">{formatCurrency(transaction.amount)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default Reports;