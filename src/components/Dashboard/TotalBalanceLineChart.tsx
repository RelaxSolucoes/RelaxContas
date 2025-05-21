import React from 'react';
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Evolução do Saldo Total</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Legend />
          <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TotalBalanceLineChart; 