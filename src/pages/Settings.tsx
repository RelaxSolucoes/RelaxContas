import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Category, Subcategory } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, category }) => {
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    type: 'expense',
    color: '#3B82F6',
    icon: '',
  });
  
  const [subcategories, setSubcategories] = useState<Omit<Subcategory, 'id'>[]>([]);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: category?.name || '',
        type: category?.type || 'expense',
        color: category?.color || '#3B82F6',
        icon: category?.icon || '',
      });

      // Fetch subcategories if editing a category
      if (category?.id) {
        fetchSubcategories(category.id);
      } else {
        setSubcategories([]);
      }

      setErrors({});
    }
  }, [isOpen, category]);

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');

      if (error) throw error;

      setSubcategories(data || []);
    } catch (error: any) {
      setErrors({ submit: error.message });
    }
  };
  
  if (!isOpen) return null;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleAddSubcategory = () => {
    if (!newSubcategoryName.trim()) {
      return;
    }

    // Check for duplicate names
    if (subcategories.some(sub => sub.name.toLowerCase() === newSubcategoryName.trim().toLowerCase())) {
      setErrors({
        ...errors,
        subcategory: 'Uma subcategoria com este nome já existe',
      });
      return;
    }

    setSubcategories([
      ...subcategories,
      {
        name: newSubcategoryName.trim(),
        category_id: category?.id || '',
      },
    ]);
    setNewSubcategoryName('');
    setErrors({
      ...errors,
      subcategory: '',
    });
  };

  const handleRemoveSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
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

      if (category) {
        // Update existing category
        const { error: categoryError } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            type: formData.type,
            color: formData.color,
            icon: formData.icon,
          })
          .eq('id', category.id)
          .eq('user_id', user.id);

        if (categoryError) throw categoryError;

        // Delete existing subcategories
        const { error: deleteError } = await supabase
          .from('subcategories')
          .delete()
          .eq('category_id', category.id);

        if (deleteError) throw deleteError;

        // Insert new subcategories
        if (subcategories.length > 0) {
          const { error: subcategoriesError } = await supabase
            .from('subcategories')
            .insert(subcategories.map(sub => ({
              ...sub,
              category_id: category.id,
            })));

          if (subcategoriesError) throw subcategoriesError;
        }
      } else {
        // Insert new category
        const { data: newCategory, error: categoryError } = await supabase
          .from('categories')
          .insert([{
            ...formData,
            user_id: user.id,
          }])
          .select()
          .single();

        if (categoryError) throw categoryError;

        // Insert subcategories for the new category
        if (subcategories.length > 0 && newCategory) {
          const { error: subcategoriesError } = await supabase
            .from('subcategories')
            .insert(subcategories.map(sub => ({
              ...sub,
              category_id: newCategory.id,
            })));

          if (subcategoriesError) throw subcategoriesError;
        }
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
              {category ? 'Editar Categoria' : 'Nova Categoria'}
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
                Nome da Categoria
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
                placeholder="Ex: Alimentação, Transporte"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
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

            {/* Subcategories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategorias
              </label>
              
              <div className="space-y-2 mb-3">
                {subcategories.map((subcategory, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <span className="text-sm">{subcategory.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubcategory(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Nova subcategoria"
                />
                <button
                  type="button"
                  onClick={handleAddSubcategory}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Adicionar
                </button>
              </div>
              {errors.subcategory && (
                <p className="text-red-500 text-xs mt-1">{errors.subcategory}</p>
              )}
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
                className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Salvando...' : category ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const Settings: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
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
        .eq('user_id', user.id)
        .order('name');

      if (categoriesError) throw categoriesError;

      setCategories(categoriesData || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCategory(undefined);
    setIsModalOpen(false);
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if category has transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (transactionsError) throw transactionsError;

      if (transactions && transactions.length > 0) {
        throw new Error('Esta categoria possui transações e não pode ser excluída');
      }

      // Delete category (subcategories will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchCategories();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <SettingsIcon size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Gerenciar Categorias</h2>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-gradient-to-r from-blue-400 to-blue-700 text-white px-4 py-2 rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 transition flex items-center gap-2"
          >
            <Plus size={16} />
            Nova Categoria
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Receitas</h3>
              <div className="space-y-2">
                {categories
                  .filter(category => category.type === 'income')
                  .map(category => (
                    <div 
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.subcategories && category.subcategories.length > 0 && (
                            <p className="text-xs text-gray-500">
                              {category.subcategories.length} subcategorias
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-white"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Despesas</h3>
              <div className="space-y-2">
                {categories
                  .filter(category => category.type === 'expense')
                  .map(category => (
                    <div 
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.subcategories && category.subcategories.length > 0 && (
                            <p className="text-xs text-gray-500">
                              {category.subcategories.length} subcategorias
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-white"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={editingCategory}
      />
    </div>
  );
};

export default Settings;