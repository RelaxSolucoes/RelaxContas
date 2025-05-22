import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CreditCard, Plus, Edit, Trash2, DollarSign, PiggyBank, Briefcase, Wallet } from 'lucide-react';
import { formatCurrency, formatCurrencyInput } from '../utils/helpers';
import { Account } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, account }) => {
  const [formData, setFormData] = useState<Omit<Account, 'id'>>({
    name: '',
    type: 'bank',
    balance: 0,
    currency: 'BRL',
    color: '#3B82F6',
    isactive: true,
    creditlimit: 0,
    duedate: 10,
    closingdate: 5,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [displayBalance, setDisplayBalance] = useState('');
  const [displayCreditLimit, setDisplayCreditLimit] = useState('');
  
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: account?.name || '',
        type: account?.type || 'bank',
        balance: account?.balance || 0,
        currency: account?.currency || 'BRL',
        color: account?.color || '#3B82F6',
        isactive: account?.isactive ?? true,
        creditlimit: account?.creditlimit || 0,
        duedate: account?.duedate || 10,
        closingdate: account?.closingdate || 5,
      });
      
      // Format display values
      setDisplayBalance(account ? formatCurrency(account.balance).replace('R$', '').trim() : '');
      setDisplayCreditLimit(account ? formatCurrency(account.creditlimit || 0).replace('R$', '').trim() : '');
      
      setErrors({});
    }
  }, [isOpen, account]);
  
  if (!isOpen) return null;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'balance' || name === 'creditlimit') {
      const masked = formatCurrencyInput(value);
      setFormData({
        ...formData,
        [name]: masked.number,
      });
      if (name === 'balance') {
        setDisplayBalance(masked.display);
      } else {
        setDisplayCreditLimit(masked.display);
      }
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
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (formData.type === 'credit' && (!formData.creditlimit || formData.creditlimit <= 0)) {
      newErrors.creditlimit = 'Limite de crédito é obrigatório para cartões de crédito';
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
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (account) {
        const { error } = await supabase
          .from('accounts')
          .update({
            name: formData.name,
            type: formData.type,
            balance: formData.balance,
            currency: formData.currency,
            color: formData.color,
            isactive: formData.isactive,
            creditlimit: formData.creditlimit,
            duedate: formData.duedate,
            closingdate: formData.closingdate,
          })
          .eq('id', account.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accounts')
          .insert([{
            name: formData.name,
            type: formData.type,
            balance: formData.balance,
            currency: formData.currency,
            color: formData.color,
            user_id: user.id,
            isactive: formData.isactive,
            creditlimit: formData.creditlimit,
            duedate: formData.duedate,
            closingdate: formData.closingdate,
          }]);

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
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
          <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {account ? 'Editar Conta' : 'Nova Conta'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Conta
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Nubank, Caixa, Dinheiro na carteira"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Conta
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="cash">Dinheiro</option>
                <option value="bank">Conta Bancária</option>
                <option value="credit">Cartão de Crédito</option>
                <option value="investment">Investimento</option>
                <option value="other">Outro</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'credit' ? 'Valor atual da fatura' : 'Saldo Atual'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                <input
                  type="text"
                  id="balance"
                  name="balance"
                  value={displayBalance}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0,00"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Cor
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-8 h-8 border border-gray-300 rounded overflow-hidden"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={handleInputChange}
                  name="color"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Moeda
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="BRL">Real (BRL)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">Libra (GBP)</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isactive"
                name="isactive"
                checked={formData.isactive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="isactive" className="ml-2 block text-sm text-gray-700">
                Conta ativa
              </label>
            </div>
            
            {formData.type === 'credit' && (
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Detalhes do Cartão de Crédito</h3>
                
                <div>
                  <label htmlFor="creditlimit" className="block text-sm font-medium text-gray-700 mb-1">
                    Limite de Crédito
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                    <input
                      type="text"
                      id="creditlimit"
                      name="creditlimit"
                      value={displayCreditLimit}
                      onChange={handleInputChange}
                      className={`w-full pl-8 pr-3 py-2 border rounded-md ${
                        errors.creditlimit ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0,00"
                    />
                  </div>
                  {errors.creditlimit && (
                    <p className="text-red-500 text-xs mt-1">{errors.creditlimit}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="closingdate" className="block text-sm font-medium text-gray-700 mb-1">
                      Dia de Fechamento
                    </label>
                    <input
                      type="number"
                      id="closingdate"
                      name="closingdate"
                      value={formData.closingdate}
                      onChange={handleInputChange}
                      min="1"
                      max="31"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="duedate" className="block text-sm font-medium text-gray-700 mb-1">
                      Dia de Vencimento
                    </label>
                    <input
                      type="number"
                      id="duedate"
                      name="duedate"
                      value={formData.duedate}
                      onChange={handleInputChange}
                      min="1"
                      max="31"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
            
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
                className="px-4 py-2 text-white bg-gradient-to-r from-blue-400 to-blue-700 rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Salvando...' : account ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('*, creditlimit, duedate, closingdate, isactive')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      // Transform the data to match our frontend model
      const transformedData = data.map(account => ({
        ...account,
        creditlimit: account.creditlimit,
        duedate: account.duedate,
        closingdate: account.closingdate,
        isactive: account.isactive,
      }));

      setAccounts(transformedData || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (account?: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingAccount(undefined);
    setIsModalOpen(false);
    fetchAccounts();
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) {
      return;
    }

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if account has transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id')
        .eq('account_id', id)
        .limit(1);

      if (transactionsError) throw transactionsError;

      if (transactions && transactions.length > 0) {
        alert('Esta conta possui transações. Transfira-as para outra conta antes de excluir.');
        return;
      }

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchAccounts();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet size={18} />;
      case 'bank':
        return <DollarSign size={18} />;
      case 'credit':
        return <CreditCard size={18} />;
      case 'investment':
        return <Briefcase size={18} />;
      default:
        return <PiggyBank size={18} />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'cash':
        return 'Dinheiro';
      case 'bank':
        return 'Conta Bancária';
      case 'credit':
        return 'Cartão de Crédito';
      case 'investment':
        return 'Investimento';
      default:
        return 'Outro';
    }
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  const totalBalance = accounts.reduce((total, account) => {
    if (account.type !== 'credit' && account.isactive) {
      return total + account.balance;
    }
    return total;
  }, 0);

  const creditCardTotal = accounts
    .filter(account => account.type === 'credit' && account.isactive)
    .reduce((total, account) => total + account.balance, 0);

  const creditCardLimit = accounts
    .filter(account => account.type === 'credit' && account.isactive)
    .reduce((total, account) => total + (account.creditlimit || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Contas</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-blue-400 to-blue-700 text-white px-3 sm:px-4 py-2 rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition flex items-center gap-2 text-sm sm:text-base"
        >
          <Plus size={16} />
          Nova Conta
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Saldo Total</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-200">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Total em contas ativas (exceto cartões de crédito)
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">Total em Faturas</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-200">{formatCurrency(creditCardTotal)}</p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            Total de faturas em aberto
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-800 rounded-xl p-3 sm:p-4">
          <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Limite Disponível</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-200">
            {formatCurrency(creditCardLimit - creditCardTotal)}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
            {creditCardLimit > 0 && (
              <>Uso: {Math.round((creditCardTotal / creditCardLimit) * 100)}% do limite</>
            )}
          </p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Suas Contas</h2>
        
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full py-16">
            <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
            <p className="text-gray-500 dark:text-white text-lg font-medium">Nenhuma conta cadastrada</p>
            <p className="text-gray-400 text-sm mt-1">Adicione sua primeira conta para começar a controlar seu saldo.</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-900 dark:to-blue-700 text-white font-semibold px-6 py-2 rounded-xl shadow hover:from-blue-600 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 transition"
            >
              Adicionar Conta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {accounts.map(account => (
              <div 
                key={account.id} 
                className={`${account.isactive ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'} rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-2 sm:mb-3 gap-2 xs:gap-0">
                  <div className="flex items-center">
                    <div 
                      className="mr-2 sm:mr-3 p-2 rounded-full"
                      style={{ backgroundColor: `${account.color}20` }}
                    >
                      <div className="text-current" style={{ color: account.color }}>
                        {getAccountIcon(account.type)}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">{account.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-300">{getAccountTypeLabel(account.type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => handleOpenModal(account)}
                      className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className={`text-xl font-bold ${!account.isactive ? 'text-gray-400 dark:text-gray-600' : 'dark:text-white'}`}>
                  {formatCurrency(account.balance, account.currency)}
                </div>
                
                {account.type === 'credit' && (
                  <div className="mt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-300">Limite:</span>
                      <span className="font-medium dark:text-white">{formatCurrency(account.creditlimit || 0, account.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-300">Disponível:</span>
                      <span className="font-medium text-green-600 dark:text-green-300">{formatCurrency((account.creditlimit || 0) - account.balance, account.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-300">Vencimento:</span>
                      <span className="font-medium dark:text-white">Todo dia {account.duedate || 1}</span>
                    </div>
                  </div>
                )}
                
                {!account.isactive && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                    Conta inativa
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        account={editingAccount}
      />
    </div>
  );
};

export default Accounts;