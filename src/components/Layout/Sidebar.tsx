import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  PiggyBank,
  Target,
  BarChart3,
  Calculator,
  Menu,
  X,
  FolderTree
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { createClient } from '@supabase/supabase-js';

const menuItems = [
  { path: '/', label: 'Painel', icon: <LayoutDashboard size={20} /> },
  { path: '/transactions', label: 'Transações', icon: <Receipt size={20} /> },
  { path: '/categories', label: 'Categorias', icon: <FolderTree size={20} /> },
  { path: '/accounts', label: 'Contas', icon: <CreditCard size={20} /> },
  { path: '/budgets', label: 'Orçamentos', icon: <PiggyBank size={20} /> },
  { path: '/goals', label: 'Metas', icon: <Target size={20} /> },
  { path: '/reports', label: 'Relatórios', icon: <BarChart3 size={20} /> },
  { path: '/calculator', label: 'Calculadoras', icon: <Calculator size={20} /> },
];

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, isOpen, toggleSidebar }) => {
  const location = useLocation();
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      setError('');
      try {
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        const { data: accounts } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id);
        const total = accounts?.reduce((sum, account) => {
          if (account.type !== 'credit') {
            return sum + account.balance;
          }
          return sum;
        }, 0) || 0;
        setTotalBalance(total);
      } catch (err: any) {
        setError('Erro ao buscar saldo');
        setTotalBalance(0);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, []);

  const sidebarClasses = `bg-[#f4f8ff] border-r border-[#dbeafe] transition-all duration-300 z-20 shadow-none
    ${isMobile
      ? isOpen
        ? 'fixed inset-y-0 left-0 w-4/5 max-w-xs'
        : 'fixed inset-y-0 -left-full w-4/5 max-w-xs'
      : 'sticky top-0 h-screen w-64'}
  `;

  const handleItemClick = () => {
    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleSidebar}
        ></div>
      )}

      <aside className={sidebarClasses + ' flex flex-col min-h-screen'}>
        <div className="flex flex-col h-full">
          <div className="p-4 sm:p-6 flex items-center gap-2 border-b border-[#dbeafe]">
            <div className="bg-blue-100 rounded-xl p-2">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#bfdbfe"/></svg>
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-[#1e3a8a] tracking-tight">Relax Contas</h1>
            {isMobile && (
              <button 
                onClick={toggleSidebar}
                className="ml-auto p-1 rounded-md hover:bg-blue-50"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-4 sm:py-6">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleItemClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-base shadow-sm
                      ${location.pathname === item.path
                        ? 'bg-[#e0e7ff] text-[#1e3a8a] shadow-md'
                        : 'text-[#2563eb] hover:bg-[#dbeafe]'}
                    `}
                  >
                    <span className={`text-xl ${location.pathname === item.path ? 'text-blue-700' : 'text-[#60a5fa]'}`}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 mt-auto">
            <div className="bg-white border border-[#dbeafe] rounded-2xl p-3 sm:p-4 flex flex-col items-center shadow-sm">
              <p className="text-xs font-semibold text-[#60a5fa] mb-1">Saldo Total</p>
              <p className="text-xl font-bold text-[#1e3a8a] mb-3">
                {loading ? 'Carregando...' : error ? error : formatCurrency(totalBalance || 0)}
              </p>
              <div className="w-full flex justify-end mb-1">
                <span className="inline-block bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">Em breve</span>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-400 to-blue-700 text-white font-semibold py-2 rounded-xl shadow hover:from-blue-500 hover:to-blue-800 transition">Atualizar Pro</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      {isMobile && !isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-4 right-4 bg-blue-700 text-white p-3 rounded-full shadow-lg z-30"
        >
          <Menu size={24} />
        </button>
      )}
    </>
  );
};

export default Sidebar;