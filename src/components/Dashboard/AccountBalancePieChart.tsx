import React, { useEffect, useState } from 'react';
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

  // Detecção de tema
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center justify-center w-full py-12">
        <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
        <p className="text-gray-500 dark:text-white text-lg font-medium">Nenhuma conta ativa encontrada</p>
        <p className="text-gray-400 text-sm mt-1">Adicione uma conta ativa para visualizar este gráfico.</p>
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
      <text x={x} y={y} fill={isDark ? '#fff' : '#334155'} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={14} fontWeight={600}>
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Saldo por Conta</h2>
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
              <div style={{ background: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ background: entry.color, width: 12, height: 12, borderRadius: 6, display: 'inline-block' }}></span>
                  <span style={{ color: isDark ? '#fff' : '#334155', fontWeight: 600 }}>{entry.name}</span>
                </div>
                <div style={{ color: isDark ? '#fff' : '#334155', fontSize: 14 }}>{Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
            );
          }} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} formatter={(value) => <span style={{ color: isDark ? '#fff' : '#334155', fontWeight: 500, fontSize: 14 }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AccountBalancePieChart; 