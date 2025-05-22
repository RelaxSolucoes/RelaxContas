import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import TransactionModal from '../components/Transactions/TransactionModal';
import { Transaction, Category, Account } from '../types';
import * as XLSX from 'xlsx';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
    categoryId: '',
    accountId: '',
    search: '',
  });
  
  // Sort
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc',
  });

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Fetch transactions
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const { data: transactionsData, error: transactionsError } = await query;

      if (transactionsError) throw transactionsError;

      // Fetch categories
      let categoriesQuery = supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      const { data: categoriesData, error: categoriesError } = await categoriesQuery;

      if (categoriesError) throw categoriesError;

      // Fetch accounts
      let accountsQuery = supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      const { data: accountsData, error: accountsError } = await accountsQuery;

      if (accountsError) throw accountsError;

      setTransactions(transactionsData || []);
      setCategories(categoriesData || []);
      setAccounts(accountsData || []);
    } catch (error: any) {
      setError(error.message);
      // Clear data in case of error
      setTransactions([]);
      setCategories([]);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters and sort
  const filteredTransactions = transactions
    .filter(transaction => {
      if (filters.type !== 'all' && transaction.type !== filters.type) return false;
      if (filters.startDate) {
        const [sy, sm, sd] = filters.startDate.split('-').map(Number);
        const startDate = new Date(sy, sm - 1, sd);
        if (new Date(transaction.date) < startDate) return false;
      }
      if (filters.endDate) {
        const [ey, em, ed] = filters.endDate.split('-').map(Number);
        const endDate = new Date(ey, em - 1, ed);
        if (new Date(transaction.date) > endDate) return false;
      }
      if (filters.categoryId && transaction.category_id !== filters.categoryId) return false;
      if (filters.accountId && transaction.account_id !== filters.accountId) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.notes?.toLowerCase().includes(searchLower) ||
          transaction.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortConfig.key === 'amount') {
        return sortConfig.direction === 'asc'
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      return 0;
    });
  
  // Calculate totals
  const totals = filteredTransactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'income') {
        acc.income += transaction.amount;
      } else {
        acc.expense += transaction.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );
  
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      type: 'all',
      startDate: '',
      endDate: '',
      categoryId: '',
      accountId: '',
      search: '',
    });
  };
  
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Função para exportar transações filtradas para Excel
  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      alert('Não há transações para exportar.');
      return;
    }
    // Monta os dados para exportação
    const exportData = filteredTransactions.map(t => ({
      Data: formatDate(t.date),
      Descrição: t.description,
      Categoria: categories.find((c: any) => c.id === t.category_id)?.name || '',
      Conta: accounts.find((a: any) => a.id === t.account_id)?.name || '',
      Valor: t.amount,
      Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
      Tags: t.tags?.join(', ') || '',
      Observações: t.notes || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');
    XLSX.writeFile(workbook, 'transacoes.xlsx');
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Transações</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button className="bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition px-4 py-2 flex items-center gap-2" onClick={handleExport}>
            <Download size={16} />
            <span>Exportar</span>
          </button>
          <button
            onClick={() => {
              setEditingTransaction(undefined);
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition px-4 py-2 flex items-center gap-2"
          >
            Nova Transação
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Saldo do Período</p>
          <p className={`text-2xl font-bold ${totals.income - totals.expense >= 0 ? 'text-blue-600 dark:text-blue-200' : 'text-red-600 dark:text-red-300'}`}>{formatCurrency(totals.income - totals.expense)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-xl p-3 sm:p-4">
          <p className="text-sm text-green-700 dark:text-green-300 font-medium">Total de Receitas</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-200">{formatCurrency(totals.income)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">Total de Despesas</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-200">{formatCurrency(totals.expense)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Pesquisar transações..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-md"
            />
          </div>
          
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-md"
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
          
          <select
            name="categoryId"
            value={filters.categoryId}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-md"
          >
            <option value="">Todas as categorias</option>
            {categories.map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            name="accountId"
            value={filters.accountId}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-md"
          >
            <option value="">Todas as contas</option>
            {accounts.map((account: any) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-md"
          />
          
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-md"
          />
          
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Empty state para transações */}
      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full py-16">
          <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
          <p className="text-gray-500 dark:text-white text-lg font-medium">Nenhuma transação encontrada</p>
          <p className="text-gray-400 text-sm mt-1">Adicione uma transação ou ajuste os filtros.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-900 dark:to-blue-700 text-white font-semibold px-6 py-2 rounded-xl shadow hover:from-blue-600 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 transition"
          >
            Nova Transação
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <div className="min-w-[600px]">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    Data
                    {sortConfig.key === 'date' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Conta
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    Valor
                    {sortConfig.key === 'amount' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredTransactions.map(transaction => {
                  const category = categories.find((c: any) => c.id === transaction.category_id);
                  const account = accounts.find((a: any) => a.id === transaction.account_id);
                  
                  return (
                    <tr 
                      key={transaction.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {transaction.type === 'income' ? (
                            <ArrowUpRight size={16} className="text-green-500 mr-2" />
                          ) : (
                            <ArrowDownRight size={16} className="text-red-500 mr-2" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {transaction.description}
                            </div>
                            {transaction.tags && transaction.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {transaction.tags.map(tag => (
                                  <span 
                                    key={tag}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: category?.color }}
                          ></div>
                          <span className="text-sm text-gray-900 dark:text-gray-100">{category?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {account?.name}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-medium ${
                          transaction.type === 'income' ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium flex flex-col sm:flex-row gap-2 sm:gap-0 justify-end items-end sm:items-center">
                        <button
                          onClick={() => handleEditTransaction(transaction)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 mr-0 sm:mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(undefined);
          fetchData();
        }}
        transaction={editingTransaction}
      />
    </div>
  );
};

export default Transactions;