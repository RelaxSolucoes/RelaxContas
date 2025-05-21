import React from 'react';
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

  const sidebarClasses = `bg-white border-r border-gray-200 transition-all duration-300 z-20 ${
    isMobile
      ? isOpen
        ? 'fixed inset-y-0 left-0 w-64'
        : 'fixed inset-y-0 -left-64 w-64'
      : 'sticky top-0 h-screen w-64'
  }`;

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

      <aside className={sidebarClasses}>
        <div className="h-full flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-gray-200">
            <h1 className="text-xl font-bold text-blue-600">RelaxContas</h1>
            {isMobile && (
              <button 
                onClick={toggleSidebar}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleItemClick}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-current">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-600">Saldo Total</p>
              <p className="text-lg font-bold text-blue-700">R$ 12.345,67</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      {isMobile && !isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-10"
        >
          <Menu size={24} />
        </button>
      )}
    </>
  );
};

export default Sidebar;