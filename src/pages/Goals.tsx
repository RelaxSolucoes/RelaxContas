import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Goal } from '../types';
import { formatCurrency } from '../utils/helpers';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, goal }) => {
  const [formData, setFormData] = useState<Omit<Goal, 'id'>>({
    name: '',
    target_amount: 0,
    current_amount: 0,
    deadline: '',
    color: '#3B82F6',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [displayTargetAmount, setDisplayTargetAmount] = useState('');
  const [displayCurrentAmount, setDisplayCurrentAmount] = useState('');
  
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: goal?.name || '',
        target_amount: goal?.target_amount || 0,
        current_amount: goal?.current_amount || 0,
        deadline: goal?.deadline || '',
        color: goal?.color || '#3B82F6',
      });
      
      // Format display values
      setDisplayTargetAmount(goal ? formatCurrency(goal.target_amount).replace('R$', '').trim() : '');
      setDisplayCurrentAmount(goal ? formatCurrency(goal.current_amount).replace('R$', '').trim() : '');
      
      setErrors({});
    }
  }, [isOpen, goal]);
  
  if (!isOpen) return null;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'target_amount' || name === 'current_amount') {
      // Remove any non-numeric characters except comma
      const numericValue = value.replace(/[^0-9,]/g, '');
      
      // Convert comma to dot for decimal
      const normalizedValue = numericValue.replace(',', '.');
      
      // Parse the value and ensure it's a valid number
      const amount = parseFloat(normalizedValue) || 0;
      
      setFormData({
        ...formData,
        [name]: amount,
      });
      
      // Update display value
      if (name === 'target_amount') {
        setDisplayTargetAmount(numericValue);
      } else {
        setDisplayCurrentAmount(numericValue);
      }
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
    
    if (formData.target_amount <= 0) {
      newErrors.target_amount = 'Valor alvo deve ser maior que zero';
    }
    
    if (formData.current_amount < 0) {
      newErrors.current_amount = 'Valor atual não pode ser negativo';
    }
    
    if (formData.current_amount > formData.target_amount) {
      newErrors.current_amount = 'Valor atual não pode ser maior que o valor alvo';
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

      if (goal) {
        const { error } = await supabase
          .from('goals')
          .update({
            name: formData.name,
            target_amount: formData.target_amount,
            current_amount: formData.current_amount,
            deadline: formData.deadline || null,
            color: formData.color,
          })
          .eq('id', goal.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('goals')
          .insert([{
            ...formData,
            user_id: user.id,
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
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {goal ? 'Editar Meta' : 'Nova Meta'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Meta
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
                placeholder="Ex: Viagem para o Japão, Comprar um carro"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 mb-1">
                Valor Alvo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                <input
                  type="text"
                  id="target_amount"
                  name="target_amount"
                  value={displayTargetAmount}
                  onChange={handleInputChange}
                  className={`w-full pl-8 pr-3 py-2 border rounded-md ${
                    errors.target_amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                />
              </div>
              {errors.target_amount && (
                <p className="text-red-500 text-xs mt-1">{errors.target_amount}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="current_amount" className="block text-sm font-medium text-gray-700 mb-1">
                Valor Atual
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                <input
                  type="text"
                  id="current_amount"
                  name="current_amount"
                  value={displayCurrentAmount}
                  onChange={handleInputChange}
                  className={`w-full pl-8 pr-3 py-2 border rounded-md ${
                    errors.current_amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                />
              </div>
              {errors.current_amount && (
                <p className="text-red-500 text-xs mt-1">{errors.current_amount}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                Data Limite (opcional)
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
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
                  value={formData.color || '#3B82F6'}
                  onChange={handleInputChange}
                  className="w-8 h-8 border border-gray-300 rounded overflow-hidden"
                />
                <input
                  type="text"
                  value={formData.color || '#3B82F6'}
                  onChange={handleInputChange}
                  name="color"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
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
                className="px-4 py-2 text-white bg-gradient-to-r from-blue-400 to-blue-700 rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Salvando...' : goal ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGoals(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (goal?: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingGoal(undefined);
    setIsModalOpen(false);
    fetchGoals();
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta meta?')) {
      return;
    }

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchGoals();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  // Calculate totals
  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const totalRemaining = totalTargetAmount - totalCurrentAmount;
  const overallPercentage = totalTargetAmount > 0 
    ? (totalCurrentAmount / totalTargetAmount) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Metas Financeiras</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition px-4 py-2 text-sm flex items-center gap-2"
        >
          <Plus size={16} />
          Nova Meta
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-700 font-medium">Total Planejado</p>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalTargetAmount)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">Total Acumulado</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCurrentAmount)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium">Faltando</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalRemaining)}</p>
        </div>
      </div>

      {/* Overall Progress */}
      {goals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-800">Progresso Geral</h3>
            <span className="text-sm font-semibold text-blue-600">
              {overallPercentage.toFixed(0)}%
            </span>
          </div>
          
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${overallPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatCurrency(0)}</span>
            <span>{formatCurrency(totalTargetAmount / 2)}</span>
            <span>{formatCurrency(totalTargetAmount)}</span>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Suas Metas</h2>
        
        {goals.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-4">Você ainda não tem metas cadastradas</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition px-4 py-2 text-sm"
            >
              Criar Primeira Meta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(goal => {
              const percentage = goal.target_amount > 0 
                ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) 
                : 0;
              
              const remainingAmount = goal.target_amount - goal.current_amount;
              
              const formatDeadline = (dateString?: string) => {
                if (!dateString) return 'Sem prazo definido';
                
                const date = new Date(dateString);
                return new Intl.DateTimeFormat('pt-BR').format(date);
              };
              
              const daysRemaining = (deadline?: string) => {
                if (!deadline) return null;
                
                const today = new Date();
                const targetDate = new Date(deadline);
                const diffTime = targetDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                return diffDays;
              };
              
              const days = daysRemaining(goal.deadline);
              
              return (
                <div 
                  key={goal.id}
                  className="rounded-xl border p-4 hover:shadow-md transition-shadow"
                  style={{ backgroundColor: `${goal.color}10`, borderColor: `${goal.color}30` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium" style={{ color: goal.color }}>
                        {goal.name}
                      </h3>
                      {goal.deadline && (
                        <p className="text-xs text-gray-500">
                          Prazo: {formatDeadline(goal.deadline)}
                          {days !== null && (
                            <span className={`ml-1 ${days < 0 ? 'text-red-500' : days < 30 ? 'text-yellow-500' : 'text-green-500'}`}>
                              ({days < 0 ? 'Atrasado' : `${days} dias restantes`})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleOpenModal(goal)}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-white hover:bg-opacity-50"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-white hover:bg-opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="text-gray-600">Meta:</span>
                    <span className="font-medium text-gray-800">{formatCurrency(goal.target_amount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="text-gray-600">Atual:</span>
                    <span className="font-medium" style={{ color: goal.color }}>
                      {formatCurrency(goal.current_amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-3 text-sm">
                    <span className="text-gray-600">Faltando:</span>
                    <span className="font-medium text-gray-800">{formatCurrency(remainingAmount)}</span>
                  </div>
                  
                  <div className="h-2 bg-gray-200 bg-opacity-50 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: goal.color }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Progresso</span>
                    <span className="text-sm font-semibold" style={{ color: goal.color }}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <GoalModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        goal={editingGoal}
      />
    </div>
  );
};

export default Goals;