import React from 'react';
import { PieChart } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, groupTransactionsByCategory } from '../../utils/helpers';
import { Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#8AC926', '#F94144', '#43AA8B', '#277DA1'
];

const ExpensesByCategoryChart: React.FC = () => {
  const { transactions, categories } = useAppContext();

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
  

  // Custom label central
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#334155" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={14} fontWeight={600}>
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Despesas por Categoria</h2>
      {expenseCategories.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center w-full py-12">
          <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
          <p className="text-gray-500 dark:text-white text-lg font-medium">Nenhuma categoria de despesa cadastrada</p>
          <p className="text-gray-400 text-sm mt-1">Adicione uma categoria para visualizar este gráfico.</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={groupedExpenses}
                dataKey="total"
                nameKey="category.name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                label={renderCustomizedLabel}
                labelLine={false}
                stroke="#fff"
                strokeWidth={3}
              >
                {groupedExpenses.map((group, index) => (
                  <Cell key={`cell-${index}`} fill={group.category?.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const entry = payload[0];
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ background: entry.color, width: 12, height: 12, borderRadius: 6, display: 'inline-block' }}></span>
                      <span className="font-semibold text-gray-700">{entry.name}</span>
                    </div>
                    <div className="text-gray-600 text-sm">{Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                  </div>
                );
              }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} formatter={(value) => <span style={{ color: '#334155', fontWeight: 500, fontSize: 14 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>

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
        </>
      )}
    </div>
  );
};

export default ExpensesByCategoryChart;