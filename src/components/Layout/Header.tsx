import React, { useState, useRef, useEffect } from 'react';
import { Bell, Plus, ChevronDown, LogOut, User, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../../context/ThemeContext';


interface HeaderProps {
  onOpenAddTransactionModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAddTransactionModal }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState<string>('Usuário');
  const { theme, toggleTheme } = useTheme();
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Bom dia', emoji: '☀️' };
    if (hour < 18) return { text: 'Boa tarde', emoji: '🌤️' };
    return { text: 'Boa noite', emoji: '🌙' };
  };
  const firstName = userName.split(' ')[0];
  const today = new Date();
  const todayStr = today.toLocaleDateString('pt-BR');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  
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

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', user.id)
          .single();
        if (profile?.name) {
          setUserName(profile.name);
        } else if (user.email) {
          setUserName(user.email);
        }
      }
    };
    fetchUser();
  }, []);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setHasUnread(false);
        setLoadingNotifications(false);
        return;
      }
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setNotifications(notifs || []);
      setHasUnread((notifs || []).some(n => !n.read));
    } catch (err) {
      setNotifications([]);
      setHasUnread(false);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
    // eslint-disable-next-line
  }, [showNotifications]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Função para marcar uma notificação como lida
  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    fetchNotifications();
  };

  // Função para limpar todas as notificações do usuário
  const clearNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);
    fetchNotifications();
  };
  
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 w-full">
      <div className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <div>
              <div className="flex items-end gap-2 sm:gap-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-2xl" style={{ lineHeight: 1 }}>{getGreeting().emoji}</span>
                    <span className="text-lg sm:text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight">{getGreeting().text}, {firstName}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white font-medium mt-0.5 ml-[2.2rem] sm:ml-[2.6rem]">
                    {todayStr}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            <div className="group relative">
              <button
                onClick={onOpenAddTransactionModal}
                className="bg-gradient-to-r from-blue-400 to-blue-700 text-white px-4 py-2 rounded-xl shadow font-semibold flex items-center gap-2 hover:from-blue-500 hover:to-blue-800 transition text-base"
                aria-label="Nova Transação"
              >
                <Plus size={20} />
                Nova Transação
              </button>
            </div>
            
            <div className="relative" ref={notificationsRef}>
              <button
                className="relative flex items-center justify-center bg-gradient-to-r from-blue-400 to-blue-700 text-white p-2 rounded-xl shadow hover:from-blue-500 hover:to-blue-800 transition"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ minWidth: 40, minHeight: 40 }}
              >
                <Bell size={20} />
                {hasUnread && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold">Notificações</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-xs text-red-500 hover:underline ml-2"
                        title="Limpar todas as notificações"
                      >
                        Limpar tudo
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="px-4 py-3 text-gray-500 text-sm">Carregando...</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-3 text-gray-500 text-sm">Sem notificações</div>
                    ) : notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer ${notif.read ? 'opacity-60' : ''}`}
                        onClick={() => !notif.read && markAsRead(notif.id)}
                        title={notif.read ? 'Notificação lida' : 'Clique para marcar como lida'}
                      >
                        <p className="text-sm font-medium flex items-center gap-2">
                          {notif.title}
                          {!notif.read && <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded ml-2">Nova</span>}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{notif.description}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-white">{userName}</span>
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
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              style={{ minWidth: 40, minHeight: 40 }}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;