import React, { useState, useEffect, useRef } from 'react';
import { PieChart, BarChartBig } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, groupTransactionsByCategory } from '../../utils/helpers';

const COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#8AC926', '#F94144', '#43AA8B', '#277DA1'
];

const ExpensesByCategoryChart: React.FC = () => {
  const { transactions, categories } = useAppContext();
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const chartRef = useRef<HTMLDivElement>(null);

  // Filter expenses from the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  
  const currentMonthExpenses = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return t.type === 'expense' && 
           transactionDate >= new Date(startOfMonth) && 
           transactionDate <= new Date(endOfMonth);
  });

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const groupedExpenses = groupTransactionsByCategory(currentMonthExpenses, expenseCategories);
  
  // Sort by amount (largest first)
  groupedExpenses.sort((a, b) => b.total - a.total);

  // For demonstration, we'll render a simplified chart with CSS
  // In a real application, you would use a library like Chart.js, Recharts, or ApexCharts
  
  const total = groupedExpenses.reduce((sum, group) => sum + group.total, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800">Despesas por Categoria</h2>
        
        <div className="bg-gray-100 rounded-md p-1 flex">
          <button
            className={`p-1 rounded ${chartType === 'pie' ? 'bg-white shadow' : ''}`}
            onClick={() => setChartType('pie')}
          >
            <PieChart size={16} />
          </button>
          <button
            className={`p-1 rounded ${chartType === 'bar' ? 'bg-white shadow' : ''}`}
            onClick={() => setChartType('bar')}
          >
            <BarChartBig size={16} />
          </button>
        </div>
      </div>
      
      <div ref={chartRef} className="mt-4 h-[250px] relative">
        {chartType === 'pie' ? (
          <div className="flex items-center justify-center h-full">
            {/* Simple CSS-based pie chart */}
            <div className="relative w-32 h-32">
              {groupedExpenses.length > 0 ? (
                <>
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {groupedExpenses.map((group, index) => {
                      const percentage = (group.total / total) * 100;
                      // This is a simplified way to create pie slices with CSS
                      // In a real app, you'd use proper chart libraries
                      return (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={group.category?.color || COLORS[index % COLORS.length]}
                          strokeWidth="20"
                          fill="transparent"
                          strokeDasharray={`${percentage} 100`}
                          strokeDashoffset={`${-25 - groupedExpenses.slice(0, index)
                            .reduce((sum, g) => sum + ((g.total / total) * 100), 0)}`}
                          className="origin-center rotate-[-90deg]"
                          style={{ transformOrigin: '50% 50%' }}
                        />
                      );
                    })}
                    <circle cx="50" cy="50" r="30" fill="white" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold">{formatCurrency(total)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Sem despesas neste mês</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full">
            {groupedExpenses.length > 0 ? (
              <div className="flex flex-col h-full justify-end">
                <div className="flex h-[200px] items-end space-x-2">
                  {groupedExpenses.slice(0, 6).map((group, index) => {
                    const percentage = (group.total / total) * 100;
                    return (
                      <div 
                        key={index} 
                        className="flex flex-col items-center flex-1"
                      >
                        <div 
                          className="w-full rounded-t-md transition-all duration-500"
                          style={{ 
                            height: `${Math.max(percentage, 5)}%`,
                            backgroundColor: group.category?.color || COLORS[index % COLORS.length] 
                          }}
                        ></div>
                        <p className="text-xs mt-1 truncate w-full text-center" title={group.category?.name}>
                          {group.category?.name?.substring(0, 8)}
                          {group.category?.name?.length > 8 ? '...' : ''}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Sem despesas neste mês</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 space-y-2">
        {groupedExpenses.slice(0, 5).map((group, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: group.category?.color || COLORS[index % COLORS.length] }}
              ></div>
              <span>{group.category?.name}</span>
            </div>
            <div className="font-medium">{formatCurrency(group.total)}</div>
          </div>
        ))}
      </div>
      
      {groupedExpenses.length > 5 && (
        <div className="mt-2 text-center">
          <button className="text-blue-600 text-sm hover:underline">
            Ver todas as categorias
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpensesByCategoryChart;