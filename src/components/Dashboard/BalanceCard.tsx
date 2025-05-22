import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

interface BalanceCardProps {
  title: string;
  amount: number;
  currency?: string;
  trend?: number;
  icon?: React.ReactNode;
  color?: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  amount,
  currency = 'BRL',
  trend,
  icon = <DollarSign size={24} />,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    purple: 'bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  };

  const cardClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  
  return (
    <div className={`rounded-xl border p-4 ${cardClass}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-sm">{title}</h3>
        <div className="p-2 rounded-full bg-white dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-50">
          {icon}
        </div>
      </div>
      
      <div className="mb-1">
        <p className="text-2xl font-bold">{formatCurrency(amount, currency)}</p>
      </div>
      
      {trend !== undefined && (
        <div className="flex items-center text-xs">
          {trend > 0 ? (
            <>
              <TrendingUp size={14} className="text-green-500 mr-1" />
              <span className="text-green-500">+{trend.toFixed(1)}%</span>
            </>
          ) : trend < 0 ? (
            <>
              <TrendingDown size={14} className="text-red-500 mr-1" />
              <span className="text-red-500">{trend.toFixed(1)}%</span>
            </>
          ) : (
            <span className="text-gray-500">0%</span>
          )}
          <span className="text-gray-500 ml-1">em relação ao mês anterior</span>
        </div>
      )}
    </div>
  );
};

export default BalanceCard;