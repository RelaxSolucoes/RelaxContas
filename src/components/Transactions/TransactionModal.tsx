import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X } from 'lucide-react';
import { Transaction } from '../../types';
import { getCurrentDate } from '../../utils/helpers';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    type: 'expense',
    description: '',
    amount: 0,
    date: getCurrentDate(),
    category_id: '',
    subcategory_id: '',
    account_id: '',
    tags: [],
    notes: '',
  });

  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [displayAmount, setDisplayAmount] = useState('');

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    if (isOpen) {
      fetchData();
      resetForm();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch categories with their subcategories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          *,
          subcategories (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      if (categoriesError) throw categoriesError;

      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (accountsError) throw accountsError;

      setCategories(categoriesData || []);
      setAccounts(accountsData || []);
    } catch (error: any) {
      setErrors({ submit: error.message });
    }
  };

  const resetForm = () => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        category_id: transaction.category_id || '',
        subcategory_id: transaction.subcategory_id || '',
        account_id: transaction.account_id,
        tags: transaction.tags || [],
        notes: transaction.notes || '',
        recurring: transaction.recurring || false,
        recurring_frequency: transaction.recurring_frequency,
      });
      setSelectedTags(transaction.tags || []);
      setDisplayAmount(transaction.amount.toString().replace('.', ','));
    } else {
      setFormData({
        type: 'expense',
        description: '',
        amount: 0,
        date: getCurrentDate(),
        category_id: '',
        subcategory_id: '',
        account_id: '',
        tags: [],
        notes: '',
      });
      setSelectedTags([]);
      setDisplayAmount('');
    }
    setErrors({});
  };

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'amount') {
      // Remove any non-numeric characters except comma
      const numericValue = value.replace(/[^0-9,]/g, '');
      
      // Convert comma to dot for decimal
      const normalizedValue = numericValue.replace(',', '.');
      
      // Parse the value and ensure it's a valid number
      const amount = parseFloat(normalizedValue) || 0;
      
      setFormData({
        ...formData,
        amount,
      });
      
      // Update display value
      setDisplayAmount(numericValue);
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      category_id: e.target.value,
      subcategory_id: '', // Reset subcategory when category changes
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      const updatedTags = [...selectedTags, newTag.trim()];
      setSelectedTags(updatedTags);
      setFormData({
        ...formData,
        tags: updatedTags,
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(updatedTags);
    setFormData({
      ...formData,
      tags: updatedTags,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }
    
    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Categoria é obrigatória';
    }
    
    if (!formData.account_id) {
      newErrors.account_id = 'Conta é obrigatória';
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

      if (transaction) {
        // For updates, include all fields including the ID
        const { error } = await supabase
          .from('transactions')
          .update({
            type: formData.type,
            description: formData.description,
            amount: formData.amount,
            date: formData.date,
            category_id: formData.category_id || null,
            subcategory_id: formData.subcategory_id || null,
            account_id: formData.account_id,
            tags: formData.tags,
            notes: formData.notes,
            recurring: formData.recurring,
            recurring_frequency: formData.recurring_frequency,
          })
          .eq('id', transaction.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // For new transactions, let Supabase generate the ID
        const { error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: formData.type,
            description: formData.description,
            amount: formData.amount,
            date: formData.date,
            category_id: formData.category_id || null,
            subcategory_id: formData.subcategory_id || null,
            account_id: formData.account_id,
            tags: formData.tags,
            notes: formData.notes,
            recurring: formData.recurring,
            recurring_frequency: formData.recurring_frequency,
          });

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

  const filteredCategories = categories.filter((c: any) => c.type === formData.type);
  const selectedCategory = categories.find((c: any) => c.id === formData.category_id);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {transaction ? 'Editar Transação' : 'Nova Transação'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            <div className="bg-gray-100 p-1 rounded-md flex">
              <button
                type="button"
                className={`flex-1 py-2 rounded-md transition-all ${
                  formData.type === 'expense' 
                    ? 'bg-white shadow text-red-600' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setFormData({ ...formData, type: 'expense' })}
              >
                Despesa
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-md transition-all ${
                  formData.type === 'income' 
                    ? 'bg-white shadow text-green-600' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setFormData({ ...formData, type: 'income' })}
              >
                Receita
              </button>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Compra de Supermercado"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Valor
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                <input
                  type="text"
                  id="amount"
                  name="amount"
                  value={displayAmount}
                  onChange={handleInputChange}
                  className={`w-full pl-8 pr-3 py-2 border rounded-md ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleCategoryChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.category_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione uma categoria</option>
                {filteredCategories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>
              )}
            </div>

            {formData.category_id && selectedCategory?.subcategories?.length > 0 && (
              <div>
                <label htmlFor="subcategory_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategoria
                </label>
                <select
                  id="subcategory_id"
                  name="subcategory_id"
                  value={formData.subcategory_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione uma subcategoria</option>
                  {selectedCategory.subcategories.map((subcategory: any) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label htmlFor="account_id" className="block text-sm font-medium text-gray-700 mb-1">
                Conta
              </label>
              <select
                id="account_id"
                name="account_id"
                value={formData.account_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.account_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account: any) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
              {errors.account_id && (
                <p className="text-red-500 text-xs mt-1">{errors.account_id}</p>
              )}
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="recurring"
                name="recurring"
                checked={formData.recurring || false}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="recurring" className="ml-2 block text-sm text-gray-700">
                Transação recorrente
              </label>
            </div>
            
            {formData.recurring && (
              <div>
                <label htmlFor="recurring_frequency" className="block text-sm font-medium text-gray-700 mb-1">
                  Frequência
                </label>
                <select
                  id="recurring_frequency"
                  name="recurring_frequency"
                  value={formData.recurring_frequency || 'monthly'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quinzenal</option>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            )}
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  id="newTag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                  placeholder="Adicionar tag"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-r-md shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition"
                >
                  Adicionar
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Observações sobre esta transação"
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-gradient-to-r from-blue-400 to-blue-700 rounded-md shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Salvando...' : transaction ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default TransactionModal;