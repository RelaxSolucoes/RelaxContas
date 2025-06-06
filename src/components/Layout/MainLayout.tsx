import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TransactionModal from '../Transactions/TransactionModal';

const MainLayout: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      } else if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col md:flex-row">
        <Sidebar 
          isMobile={isMobile} 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
        />
        
        <main className="flex-1 min-h-screen w-full">
          <div className="max-w-[1600px] mx-auto w-full">
            <Header onOpenAddTransactionModal={() => setIsAddTransactionModalOpen(true)} />
            <div className="p-2 sm:p-4">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <TransactionModal 
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
      />
    </div>
  );
};

export default MainLayout;