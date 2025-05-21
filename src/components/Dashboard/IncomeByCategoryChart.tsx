import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction, Category } from '../../types';

const COLORS = [
  '#22c55e', '#3B82F6', '#6366F1', '#06B6D4', '#22D3EE', '#818CF8', '#F59E42', '#F472B6', '#34D399', '#F87171', '#FBBF24'
];

interface IncomeByCategoryChartProps {
  transactions: Transaction[];
  categories: Category[];
}

const IncomeByCategoryChart: React.FC<IncomeByCategoryChartProps> = ({ transactions, categories }) => {
  // Filtra receitas do mês atual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthIncomes = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'income' && d >= startOfMonth && d <= endOfMonth;
  });

  // Agrupa por categoria
  const grouped = categories.filter(c => c.type === 'income').map(category => {
    const total = monthIncomes.filter(t => t.category_id === category.id).reduce((sum, t) => sum + t.amount, 0);
    return {
      name: category.name,
      value: total,
      color: category.color,
    };
  }).filter(g => g.value > 0);

  if (grouped.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        Nenhuma receita registrada neste mês
      </div>
    );
  }

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
      <h2 className="text-xl font-bold mb-6 text-gray-800">Receitas por Categoria</h2>
      <ResponsiveContainer width="100%" height={340}>
        <PieChart>
          <Pie
            data={grouped}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            label={renderCustomizedLabel}
            labelLine={false}
            stroke="#fff"
            strokeWidth={3}
          >
            {grouped.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
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
    </div>
  );
};

export default IncomeByCategoryChart; 