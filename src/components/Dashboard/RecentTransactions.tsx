import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Link } from 'react-router-dom';

const RecentTransactions: React.FC = () => {
  const { transactions, categories, accounts } = useAppContext();

  // Sort transactions by date (most recent first)
  const sortedTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800">Transações Recentes</h2>
        <Link 
          to="/transactions" 
          className="text-blue-600 text-sm flex items-center hover:underline"
        >
          Ver todas <ChevronRight size={16} />
        </Link>
      </div>
      
      <div className="space-y-3">
        {sortedTransactions.length > 0 ? (
          sortedTransactions.map(transaction => {
            const category = categories.find(c => c.id === transaction.category_id);
            const account = accounts.find(a => a.id === transaction.account_id);
            
            return (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: category?.color || '#e2e8f0' }}
                  >
                    <span className="text-white text-xs">
                      {category?.name?.substring(0, 2).toUpperCase() || 'TX'}
                    </span>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-800">{transaction.description}</p>
                    <div className="flex text-xs text-gray-500">
                      <span>{formatDate(transaction.date)}</span>
                      <span className="mx-1">•</span>
                      <span>{account?.name || 'Conta'}</span>
                    </div>
                  </div>
                </div>
                
                <div className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                  {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center w-full py-12">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-2"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
            <p className="text-gray-500 text-base font-medium">Nenhuma transação encontrada</p>
            <p className="text-gray-400 text-xs mt-1">Adicione uma transação para visualizar aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;