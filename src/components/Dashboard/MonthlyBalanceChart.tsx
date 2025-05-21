import React from 'react';
import { ResponsiveContainer, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar } from 'recharts';
import { Transaction } from '../../types';

interface MonthlyBalanceChartProps {
  transactions: Transaction[];
}

function getMonthLabel(date: Date) {
  return date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
}

const MonthlyBalanceChart: React.FC<MonthlyBalanceChartProps> = ({ transactions }) => {
  // Gera os últimos 6 meses
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: getMonthLabel(d) };
  });

  // Monta os dados para o gráfico
  const data = months.map(({ year, month, label }) => {
    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      name: label,
      Receitas: income,
      Despesas: expense,
      Saldo: income - expense,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Balanço Mensal</h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 20, right: 40, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 14, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 14, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} tickFormatter={v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload) return null;
            return (
              <div className="bg-white border border-gray-200 rounded-lg shadow p-3">
                <div className="font-semibold text-gray-700 mb-1">{label}</div>
                {payload.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <span style={{ background: entry.color, width: 10, height: 10, borderRadius: 5, display: 'inline-block' }}></span>
                    <span className="text-sm text-gray-600">{entry.name}:</span>
                    <span className="font-bold" style={{ color: entry.color }}>{typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
                  </div>
                ))}
              </div>
            );
          }} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} formatter={(value) => <span style={{ color: '#334155', fontWeight: 500, fontSize: 14 }}>{value}</span>} />
          <Bar dataKey="Receitas" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={28} />
          <Bar dataKey="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={28} />
          <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} strokeDasharray="5 2" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyBalanceChart; 