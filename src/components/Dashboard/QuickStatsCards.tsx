import React from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingDown, Wallet, Target, ListChecks } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

interface QuickStatsCardsProps {
  totalTransactions: number;
  avgDailyExpense: number;
  biggestExpense: number;
  biggestIncome: number;
  activeAccounts: number;
  activeGoals: number;
}

const QuickStatsCards: React.FC<QuickStatsCardsProps> = ({
  totalTransactions,
  avgDailyExpense,
  biggestExpense,
  biggestIncome,
  activeAccounts,
  activeGoals,
}) => {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
      <div className="bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow p-6 flex flex-col min-w-[140px] min-h-[120px] justify-between dark:from-blue-900 dark:to-blue-700">
        <div className="flex items-center gap-2 mb-3">
          <ListChecks size={24} />
          <span className="font-medium text-base">Transações</span>
        </div>
        <span className="font-bold break-words whitespace-pre-line leading-tight max-w-full" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.8rem)' }}>{totalTransactions}</span>
      </div>
      <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-xl shadow p-6 flex flex-col min-w-[140px] min-h-[120px] justify-between dark:from-blue-900 dark:to-blue-600">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={24} />
          <span className="font-medium text-base">Contas ativas</span>
        </div>
        <span className="font-bold break-words whitespace-pre-line leading-tight max-w-full" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.8rem)' }}>{activeAccounts}</span>
      </div>
      <div className="bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-xl shadow p-6 flex flex-col min-w-[140px] min-h-[120px] justify-between dark:from-purple-900 dark:to-purple-600">
        <div className="flex items-center gap-2 mb-3">
          <Target size={24} />
          <span className="font-medium text-base">Metas ativas</span>
        </div>
        <span className="font-bold break-words whitespace-pre-line leading-tight max-w-full" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.8rem)' }}>{activeGoals}</span>
      </div>
      <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl shadow p-6 flex flex-col min-w-[140px] min-h-[120px] justify-between dark:from-green-900 dark:to-green-600">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpRight size={24} />
          <span className="font-medium text-base">Maior receita</span>
        </div>
        <span className="font-bold break-words whitespace-pre-line leading-tight max-w-full" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.8rem)' }}>{formatCurrency(biggestIncome)}</span>
      </div>
      <div className="bg-gradient-to-r from-red-400 to-red-600 text-white rounded-xl shadow p-6 flex flex-col min-w-[140px] min-h-[120px] justify-between dark:from-red-900 dark:to-red-600">
        <div className="flex items-center gap-2 mb-3">
          <ArrowDownRight size={24} />
          <span className="font-medium text-base">Média diária de gastos</span>
        </div>
        <span className="font-bold break-words whitespace-pre-line leading-tight max-w-full" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.8rem)' }}>{formatCurrency(avgDailyExpense)}</span>
      </div>
      <div className="bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl shadow p-6 flex flex-col min-w-[140px] min-h-[120px] justify-between dark:from-red-900 dark:to-red-700">
        <div className="flex items-center gap-2 mb-3">
          <ArrowDownRight size={24} />
          <span className="font-medium text-base">Maior despesa</span>
        </div>
        <span className="font-bold break-words whitespace-pre-line leading-tight max-w-full" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.8rem)' }}>{formatCurrency(biggestExpense)}</span>
      </div>
    </div>
  );
};

export default QuickStatsCards; 