import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { formatCurrency, formatCurrencyInput } from '../utils/helpers';
import { Budget, Category } from '../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget?: Budget;
}

const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, onClose, budget }) => {
  const [formData, setFormData] = useState<Omit<Budget, 'id'>>({
    category_id: '',
    subcategory_id: undefined,
    amount: 0,
    period: 'monthly',
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [displayAmount, setDisplayAmount] = useState('');
  
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      resetForm();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense');

      if (error) throw error;

      setCategories(data || []);
    } catch (error: any) {
      setErrors({ submit: error.message });
    }
  };

  const resetForm = () => {
    if (budget) {
      setFormData({
        category_id: budget.category_id,
        subcategory_id: budget.subcategory_id || undefined,
        amount: budget.amount,
        period: budget.period,
      });
      setDisplayAmount(budget.amount.toString().replace('.', ','));
    } else {
      setFormData({
        category_id: '',
        subcategory_id: undefined,
        amount: 0,
        period: 'monthly',
      });
      setDisplayAmount('');
    }
    setErrors({});
  };
  
  if (!isOpen) return null;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      const masked = formatCurrencyInput(value);
      setFormData({
        ...formData,
        amount: masked.number,
      });
      setDisplayAmount(masked.display);
    } else {
      setFormData({
        ...formData,
        [name]: value === '' ? undefined : value,
      });
    }
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.category_id) {
      newErrors.category_id = 'Categoria é obrigatória';
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const budgetData = {
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id,
        amount: formData.amount,
        period: formData.period,
        user_id: user.id,
      };

      if (budget) {
        const { error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', budget.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert([budgetData]);

        if (error) throw error;
      }
      
      onClose();
    } catch (error: any) {
      setErrors({
        submit: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === formData.category_id);
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {budget ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg dark:bg-red-900 dark:border-red-800 dark:text-red-300">
                {errors.submit}
              </div>
            )}

            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Categoria
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 ${errors.category_id ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-800'}`}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-xs mt-1 dark:text-red-300">{errors.category_id}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Valor Limite
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-300">R$</span>
                <input
                  type="text"
                  id="amount"
                  name="amount"
                  value={displayAmount}
                  onChange={handleInputChange}
                  className={`w-full pl-8 pr-3 py-2 border rounded-md bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 ${errors.amount ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-800'}`}
                  placeholder="0,00"
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1 dark:text-red-300">{errors.amount}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Período
              </label>
              <select
                id="period"
                name="period"
                value={formData.period}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800"
              >
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition px-4 py-2 dark:from-blue-900 dark:to-blue-700 dark:hover:from-blue-800 dark:hover:to-blue-900"
                disabled={loading}
              >
                {loading ? 'Salvando...' : budget ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (budgetsError) throw budgetsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense');

      if (categoriesError) throw categoriesError;

      setBudgets(budgetsData || []);
      setCategories(categoriesData || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (budget?: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingBudget(undefined);
    setIsModalOpen(false);
    fetchData();
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  // Calculate totals
  const totalBudgeted = budgets
    .filter(budget => budget.period === 'monthly')
    .reduce((total, budget) => total + budget.amount, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <h2 className="text-lg font-semibold text-gray-800">Seus Orçamentos</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Orçamentos</h1>
          <div className="flex flex-row flex-wrap gap-2 items-center w-full sm:w-auto">
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setView('cards')}
                className={`px-3 py-1.5 text-sm ${
                  view === 'cards' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                style={{ minWidth: 70 }}
              >
                Cards
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-3 py-1.5 text-sm ${
                  view === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                style={{ minWidth: 70 }}
              >
                Tabela
              </button>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition px-3 sm:px-4 py-2 text-sm sm:text-base flex items-center gap-2"
            >
              <Plus size={16} />
              Novo Orçamento
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl dark:bg-red-900 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 dark:bg-blue-900 dark:border-blue-800">
          <p className="text-sm text-blue-700 font-medium dark:text-blue-300">Total Orçado (Mensal)</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-200">{formatCurrency(totalBudgeted)}</p>
        </div>
      </div>

      {/* Budgets List */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <h2 className="text-lg font-semibold text-gray-800">Seus Orçamentos</h2>
        </div>
        
        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full py-16">
            <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
            <p className="text-gray-500 dark:text-white text-lg font-medium">Nenhum orçamento cadastrado</p>
            <p className="text-gray-400 text-sm mt-1">Crie seu primeiro orçamento para controlar seus gastos.</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold px-6 py-2 rounded-xl shadow hover:from-blue-600 hover:to-blue-800 transition dark:from-blue-900 dark:to-blue-700 dark:hover:from-blue-800 dark:hover:to-blue-900"
            >
              Criar Primeiro Orçamento
            </button>
          </div>
        ) : view === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {budgets.map(budget => {
              const category = categories.find((c) => c.id === budget.category_id);
              
              return (
                <div 
                  key={budget.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-2 sm:mb-3 gap-2 xs:gap-0">
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base dark:text-gray-100">{category?.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {budget.period === 'monthly' ? 'Mensal' : 'Anual'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleOpenModal(budget)}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-300 dark:hover:bg-gray-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:text-red-300 dark:hover:bg-gray-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-800 dark:text-white">
                    {formatCurrency(budget.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
            <div className="min-w-[400px]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Período
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {budgets.map(budget => {
                    const category = categories.find((c) => c.id === budget.category_id);
                    
                    return (
                      <tr key={budget.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                          {budget.period === 'monthly' ? 'Mensal' : 'Anual'}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium text-gray-800 dark:text-white">
                          {formatCurrency(budget.amount)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium flex flex-col sm:flex-row gap-2 sm:gap-0 justify-end items-end sm:items-center">
                          <button
                            onClick={() => handleOpenModal(budget)}
                            className="text-blue-600 hover:text-blue-900 mr-0 sm:mr-3 dark:text-blue-300 dark:hover:text-blue-500"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-300 dark:hover:text-red-500"
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
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        budget={editingBudget}
      />
    </div>
  );
};

export default Budgets;