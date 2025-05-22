import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';

interface BudgetProgressCardProps {
  budgetId: string;
}

const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({ budgetId }) => {
  const { budgets, categories, getBudgetProgress } = useAppContext();
  
  const budget = budgets.find(b => b.id === budgetId);
  if (!budget) return null;
  
  const category = categories.find(c => c.id === budget.category_id);
  const subcategory = category?.subcategories?.find(s => s.id === budget.subcategory_id);
  
  const { spent, remaining, percentage } = getBudgetProgress(budgetId);
  
  // Determine color based on percentage
  let progressColor = 'bg-green-500';
  let textColor = 'text-green-600';
  
  if (percentage >= 80 && percentage < 100) {
    progressColor = 'bg-yellow-500';
    textColor = 'text-yellow-600';
  } else if (percentage >= 100) {
    progressColor = 'bg-red-500';
    textColor = 'text-red-600';
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-800 dark:text-gray-100">
          {subcategory ? `${category?.name} > ${subcategory.name}` : category?.name}
        </h3>
        <span className={`text-sm font-semibold ${textColor}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full ${progressColor} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-300">Gasto: </span>
          <span className="font-medium">{formatCurrency(spent)}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-300">Meta: </span>
          <span className="font-medium">{formatCurrency(budget.amount)}</span>
        </div>
      </div>
    </div>
  );
};

export default BudgetProgressCard;