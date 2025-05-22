import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Transaction, Account } from '../../types';

function getMonthLabel(date: Date) {
  return date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
}

interface TotalBalanceLineChartProps {
  transactions: Transaction[];
  accounts: Account[];
}

const TotalBalanceLineChart: React.FC<TotalBalanceLineChartProps> = ({ transactions, accounts }) => {
  // Gera os últimos 6 meses
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: getMonthLabel(d) };
  });

  // Para cada mês, calcula o saldo final (todas as contas exceto crédito)
  const data = months.map(({ year, month, label }) => {
    // Transações até o fim do mês
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    // Soma saldo inicial das contas
    let saldo = accounts.filter(a => a.type !== 'credit').reduce((sum, acc) => sum + acc.balance, 0);
    // Soma receitas e despesas até o fim do mês
    const txs = transactions.filter(t => new Date(t.date) <= endOfMonth);
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    saldo = income - expense;
    return {
      name: label,
      Saldo: saldo,
    };
  });

  const hasData = data.some(d => d.Saldo !== 0);

  // Detecção de tema
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="text-lg font-semibold mb-4 dark:text-white">Evolução do Saldo Total</h2>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center w-full py-12">
          <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
          <p className="text-gray-500 dark:text-white text-lg font-medium">Sem dados suficientes para exibir o gráfico</p>
          <p className="text-gray-400 text-sm mt-1">Adicione transações para visualizar a evolução do saldo.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e5e7eb'} />
            <XAxis dataKey="name" tick={{ fontSize: 14, fill: isDark ? '#fff' : '#334155' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 14, fill: isDark ? '#fff' : '#334155' }} axisLine={false} tickLine={false} tickFormatter={v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload) return null;
              return (
                <div style={{ background: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: isDark ? '#fff' : '#334155' }}>{label}</div>
                  {payload.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ background: entry.color, width: 10, height: 10, borderRadius: 5, display: 'inline-block' }}></span>
                      <span style={{ color: isDark ? '#fff' : '#334155', fontSize: 14 }}>{entry.name}:</span>
                      <span style={{ color: entry.color, fontWeight: 700 }}>{typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
                    </div>
                  ))}
                </div>
              );
            }} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} formatter={value => <span style={{ color: isDark ? '#fff' : '#334155', fontWeight: 500, fontSize: 14 }}>{value}</span>} />
            <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', stroke: isDark ? '#1e293b' : '#fff', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TotalBalanceLineChart; 