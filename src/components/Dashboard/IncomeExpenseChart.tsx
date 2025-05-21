import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, getMonthName } from '../../utils/helpers';

const IncomeExpenseChart: React.FC = () => {
  const { transactions } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState<'3months' | '6months' | '1year'>('3months');

  // Get current date
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Determine how many months to show based on selected period
  const monthsToShow = 
    selectedPeriod === '3months' ? 3 : 
    selectedPeriod === '6months' ? 6 : 12;

  // Prepare labels and empty data arrays
  const labels: string[] = [];
  const incomeData: number[] = [];
  const expenseData: number[] = [];

  // Calculate income and expense for each month in the period
  for (let i = monthsToShow - 1; i >= 0; i--) {
    let month = currentMonth - i;
    let year = currentYear;
    
    if (month < 0) {
      month += 12;
      year -= 1;
    }
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    // Filter transactions for this month
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= startOfMonth && date <= endOfMonth;
    });
    
    // Calculate totals
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Add to arrays
    labels.push(getMonthName(month).substring(0, 3));
    incomeData.push(income);
    expenseData.push(expense);
  }

  // Find max value for chart scaling
  const maxValue = Math.max(
    ...incomeData, 
    ...expenseData
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800">Receitas vs Despesas</h2>
        
        <div className="space-x-1 text-sm">
          <button 
            className={`px-2 py-1 rounded ${selectedPeriod === '3months' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setSelectedPeriod('3months')}
          >
            3M
          </button>
          <button 
            className={`px-2 py-1 rounded ${selectedPeriod === '6months' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setSelectedPeriod('6months')}
          >
            6M
          </button>
          <button 
            className={`px-2 py-1 rounded ${selectedPeriod === '1year' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setSelectedPeriod('1year')}
          >
            1A
          </button>
        </div>
      </div>
      
      <div className="mt-4 h-[250px]">
        {/* Chart container */}
        <div className="h-full flex items-end">
          {labels.map((label, index) => (
            <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
              {/* Income bar */}
              <div className="w-full flex justify-center mb-1">
                <div 
                  className="w-5 bg-green-500 rounded-t relative group"
                  style={{ 
                    height: `${(incomeData[index] / maxValue) * 180}px`,
                    minHeight: incomeData[index] > 0 ? '4px' : '0' 
                  }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity">
                    {formatCurrency(incomeData[index])}
                  </div>
                </div>
              </div>
              
              {/* Expense bar */}
              <div className="w-full flex justify-center mb-1">
                <div 
                  className="w-5 bg-red-500 rounded-t relative group"
                  style={{ 
                    height: `${(expenseData[index] / maxValue) * 180}px`,
                    minHeight: expenseData[index] > 0 ? '4px' : '0'
                  }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity">
                    {formatCurrency(expenseData[index])}
                  </div>
                </div>
              </div>
              
              {/* Month label */}
              <div className="text-xs mt-1 text-gray-600">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-2 flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Receitas</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Despesas</span>
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenseChart;