import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Account } from '../../types';

const COLORS = [
  '#3B82F6', '#6366F1', '#06B6D4', '#22D3EE', '#818CF8', '#F59E42', '#F472B6', '#34D399', '#F87171', '#FBBF24'
];

interface AccountBalancePieChartProps {
  accounts: Account[];
}

const AccountBalancePieChart: React.FC<AccountBalancePieChartProps> = ({ accounts }) => {
  // Filtra apenas contas ativas e não crédito
  const filtered = accounts.filter(acc => acc.isactive && acc.type !== 'credit');
  const data = filtered.map((acc) => ({
    name: acc.name,
    value: acc.balance,
    color: acc.color || COLORS[0],
  }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        Nenhuma conta ativa encontrada
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
      <h2 className="text-xl font-bold mb-6 text-gray-800">Saldo por Conta</h2>
      <ResponsiveContainer width="100%" height={340}>
        <PieChart>
          <Pie
            data={data}
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
            {data.map((entry, index) => (
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

export default AccountBalancePieChart; 