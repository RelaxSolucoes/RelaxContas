import React, { useState, useRef, useEffect } from 'react';
import { Bell, Plus, ChevronDown, Search, LogOut, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const pathNames: Record<string, string> = {
  '/': 'Painel',
  '/transactions': 'Transações',
  '/accounts': 'Contas',
  '/budgets': 'Orçamentos',
  '/goals': 'Metas',
  '/reports': 'Relatórios',
  '/calculator': 'Calculadoras',
  '/categories': 'Categorias',
};

interface HeaderProps {
  onOpenAddTransactionModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAddTransactionModal }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const pageTitle = pathNames[location.pathname] || 'Página';
  
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">{pageTitle}</h1>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="w-64 pl-10 pr-4 py-2 bg-gray-100 rounded-lg"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAddTransactionModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nova Transação</span>
            </button>
            
            <div className="relative" ref={notificationsRef}>
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="font-semibold">Notificações</h3>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm font-medium">Fatura do cartão próxima do vencimento</p>
                      <p className="text-xs text-gray-500 mt-1">Vence em 3 dias</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm font-medium">Meta "Viagem" atingiu 80%</p>
                      <p className="text-xs text-gray-500 mt-1">Faltam R$ 1.000,00</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  U
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700">Usuário</span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User size={16} />
                    Perfil
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;