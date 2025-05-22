import React, { useState } from 'react';
import { Calculator as CalculatorIcon, RefreshCw } from 'lucide-react';
import { formatCurrencyInput } from '../utils/helpers';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const Calculator: React.FC = () => {
  const [selectedCalculator, setSelectedCalculator] = useState<'investment' | 'loan'>('investment');
  
  // Investment calculator state
  const [investmentData, setInvestmentData] = useState({
    initialAmount: 0,
    displayInitialAmount: '',
    monthlyContribution: 0,
    displayMonthlyContribution: '',
    interestRate: 0,
    displayInterestRate: '',
    period: 0,
    displayPeriod: '',
  });
  
  // Loan calculator state
  const [loanData, setLoanData] = useState({
    loanAmount: 0,
    displayLoanAmount: '',
    interestRate: 0,
    displayInterestRate: '',
    period: 0,
    displayPeriod: '',
  });
  
  // Adicionar estado para unidade da taxa de juros
  const [investmentRateUnit, setInvestmentRateUnit] = useState<'ano' | 'mes'>('ano');
  const [loanRateUnit, setLoanRateUnit] = useState<'ano' | 'mes'>('mes');
  
  // Adicionar estado para unidade do período
  const [investmentPeriodUnit, setInvestmentPeriodUnit] = useState<'anos' | 'meses'>('anos');
  const [loanPeriodUnit, setLoanPeriodUnit] = useState<'anos' | 'meses'>('meses');
  
  const { width, height } = useWindowSize();
  
  // Investment calculation
  const calculateInvestment = () => {
    const { initialAmount, monthlyContribution, interestRate, period } = investmentData;
    const rate = investmentRateUnit === 'ano' ? interestRate : ((Math.pow(1 + (interestRate / 100), 12) - 1) * 100);
    const monthlyRate = (rate / 100) / 12;
    const months = investmentPeriodUnit === 'anos' ? period * 12 : period;
    let futureValue = initialAmount;
    for (let i = 0; i < months; i++) {
      futureValue = (futureValue + monthlyContribution) * (1 + monthlyRate);
    }
    const totalInvested = initialAmount + (monthlyContribution * months);
    const interestEarned = futureValue - totalInvested;
    return {
      futureValue,
      totalInvested,
      interestEarned,
    };
  };
  
  // Loan calculation
  const calculateLoan = () => {
    const { loanAmount, interestRate, period } = loanData;
    const rate = loanRateUnit === 'ano' ? interestRate : ((Math.pow(1 + (interestRate / 100), 12) - 1) * 100);
    const monthlyRate = (rate / 100) / 12;
    const months = loanPeriodUnit === 'anos' ? period * 12 : period;
    const monthlyPayment = 
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
      (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - loanAmount;
    return {
      monthlyPayment,
      totalPayment,
      totalInterest,
    };
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  const handleInvestmentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'initialAmount' || name === 'monthlyContribution') {
      const masked = formatCurrencyInput(value);
      setInvestmentData(prev => ({
        ...prev,
        [name]: masked.number,
        [`display${name.charAt(0).toUpperCase() + name.slice(1)}`]: masked.display,
      }));
    } else if (name === 'interestRate' || name === 'period') {
      let cleaned = value.replace(/\D/g, '');
      cleaned = cleaned.replace(/^0+/, '');
      setInvestmentData(prev => ({
        ...prev,
        [name]: cleaned === '' ? 0 : parseInt(cleaned, 10),
        [`display${name.charAt(0).toUpperCase() + name.slice(1)}`]: cleaned,
      }));
    } else {
      setInvestmentData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    }
  };
  
  const handleLoanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'loanAmount') {
      const masked = formatCurrencyInput(value);
      setLoanData(prev => ({
        ...prev,
        loanAmount: masked.number,
        displayLoanAmount: masked.display,
      }));
    } else if (name === 'interestRate' || name === 'period') {
      let cleaned = value.replace(/\D/g, '');
      cleaned = cleaned.replace(/^0+/, '');
      setLoanData(prev => ({
        ...prev,
        [name]: cleaned === '' ? 0 : parseInt(cleaned, 10),
        [`display${name.charAt(0).toUpperCase() + name.slice(1)}`]: cleaned,
      }));
    } else {
      setLoanData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    }
  };
  
  const investmentResults = calculateInvestment();
  const isLoanValid = loanData.loanAmount > 0 && loanData.interestRate > 0 && loanData.period > 0;
  const loanResults = isLoanValid ? calculateLoan() : {
    monthlyPayment: 0,
    totalPayment: 0,
    totalInterest: 0,
  };

  // Gerar dados para o gráfico de investimentos
  const getInvestmentChartData = () => {
    const { initialAmount, monthlyContribution, interestRate, period } = investmentData;
    if (initialAmount <= 0 || period <= 0) return [];
    const rate = investmentRateUnit === 'ano' ? interestRate : ((Math.pow(1 + (interestRate / 100), 12) - 1) * 100);
    const monthlyRate = (rate / 100) / 12;
    const months = investmentPeriodUnit === 'anos' ? period * 12 : period;
    let saldo = initialAmount;
    let investido = initialAmount;
    const data = [
      { periodo: 0, investido: initialAmount, total: initialAmount }
    ];
    for (let i = 1; i <= months; i++) {
      saldo = (saldo + monthlyContribution) * (1 + monthlyRate);
      investido += monthlyContribution;
      data.push({
        periodo: i,
        investido,
        total: saldo
      });
    }
    return data;
  };
  const investmentChartData = getInvestmentChartData();

  // Gerar dados detalhados para a tabela mês a mês
  const getInvestmentTableData = () => {
    const { initialAmount, monthlyContribution, interestRate, period } = investmentData;
    if (initialAmount <= 0 || period <= 0) return [];
    const rate = investmentRateUnit === 'ano' ? interestRate : ((Math.pow(1 + (interestRate / 100), 12) - 1) * 100);
    const monthlyRate = (rate / 100) / 12;
    const months = investmentPeriodUnit === 'anos' ? period * 12 : period;
    let saldo = initialAmount;
    let investido = initialAmount;
    let totalJuros = 0;
    const data = [
      {
        mes: 0,
        jurosMes: 0,
        investido: initialAmount,
        totalJuros: 0,
        total: initialAmount
      }
    ];
    for (let i = 1; i <= months; i++) {
      const jurosMes = (saldo + monthlyContribution) * monthlyRate;
      saldo = (saldo + monthlyContribution) * (1 + monthlyRate);
      investido += monthlyContribution;
      totalJuros = saldo - investido;
      data.push({
        mes: i,
        jurosMes: Math.round(jurosMes * 100) / 100,
        investido,
        totalJuros,
        total: saldo
      });
    }
    return data;
  };
  const investmentTableData = getInvestmentTableData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Calculadoras Financeiras</h1>
      
      {/* Calculator Type Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex gap-2">
          <button 
            onClick={() => setSelectedCalculator('investment')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${
              selectedCalculator === 'investment' 
                ? 'bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CalculatorIcon size={16} />
            Investimentos
          </button>
          <button 
            onClick={() => setSelectedCalculator('loan')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${
              selectedCalculator === 'loan' 
                ? 'bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw size={16} />
            Empréstimos
          </button>
        </div>
      </div>
      
      {/* Calculator Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedCalculator === 'investment' ? 'Calculadora de Investimentos' : 'Calculadora de Empréstimos'}
          </h2>
          
          {selectedCalculator === 'investment' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="initialAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Inicial
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                  <input
                    type="text"
                    id="initialAmount"
                    name="initialAmount"
                    value={investmentData.displayInitialAmount}
                    onChange={handleInvestmentInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="monthlyContribution" className="block text-sm font-medium text-gray-700 mb-1">
                  Aporte Mensal
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                  <input
                    type="text"
                    id="monthlyContribution"
                    name="monthlyContribution"
                    value={investmentData.displayMonthlyContribution}
                    onChange={handleInvestmentInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Taxa de Juros (%)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    id="interestRate"
                    name="interestRate"
                    value={investmentData.displayInterestRate}
                    onChange={handleInvestmentInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <select
                    value={investmentRateUnit}
                    onChange={(e) => setInvestmentRateUnit(e.target.value as 'ano' | 'mes')}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="ano">Ano</option>
                    <option value="mes">Mês</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    id="period"
                    name="period"
                    value={investmentData.displayPeriod}
                    onChange={handleInvestmentInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <select
                    value={investmentPeriodUnit}
                    onChange={(e) => setInvestmentPeriodUnit(e.target.value as 'anos' | 'meses')}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="anos">Anos</option>
                    <option value="meses">Meses</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do Empréstimo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                  <input
                    type="text"
                    id="loanAmount"
                    name="loanAmount"
                    value={loanData.displayLoanAmount}
                    onChange={handleLoanInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Taxa de Juros (%)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    id="interestRate"
                    name="interestRate"
                    value={loanData.displayInterestRate}
                    onChange={handleLoanInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <select
                    value={loanRateUnit}
                    onChange={(e) => setLoanRateUnit(e.target.value as 'ano' | 'mes')}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="ano">Ano</option>
                    <option value="mes">Mês</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    id="period"
                    name="period"
                    value={loanData.displayPeriod}
                    onChange={handleLoanInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <select
                    value={loanPeriodUnit}
                    onChange={(e) => setLoanPeriodUnit(e.target.value as 'anos' | 'meses')}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="anos">Anos</option>
                    <option value="meses">Meses</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Results */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Resultados</h2>
          
          {selectedCalculator === 'investment' ? (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm font-semibold mb-1 text-[#7c3aed]">Valor Final</p>
                <p className="text-2xl font-bold text-[#7c3aed]">
                  {formatCurrency(investmentResults.futureValue)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm font-semibold mb-1 text-[#2563eb]">Total Investido</p>
                  <p className="text-2xl font-bold text-[#2563eb]">
                    {formatCurrency(investmentResults.totalInvested)}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="text-sm font-semibold mb-1 text-[#22c55e]">Juros Ganhos</p>
                  <p className="text-2xl font-bold text-[#22c55e]">
                    {formatCurrency(investmentResults.interestEarned)}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ 
                      width: `${(investmentResults.totalInvested / investmentResults.futureValue) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Principal</span>
                  <span>Juros</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Parcela Mensal</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(loanResults.monthlyPayment)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">Total a Pagar</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(loanResults.totalPayment)}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="text-sm text-purple-700 font-medium">Total de Juros</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(loanResults.totalInterest)}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500"
                    style={{ 
                      width: `${(loanData.loanAmount / loanResults.totalPayment) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Principal</span>
                  <span>Juros</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Destaque de renda passiva com confete */}
      {selectedCalculator === 'investment' && investmentTableData.length > 1 && (
        <div className="w-full flex justify-center my-8">
          <div className="relative w-full">
            <Confetti width={width} height={200} numberOfPieces={300} recycle={false} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} />
            <div className="text-center w-full relative z-10">
              <span className="block text-xl md:text-2xl font-semibold text-gray-800 mb-1">
                No final de {investmentTableData[investmentTableData.length - 1].mes} meses você terá uma
              </span>
              <span className="block text-2xl md:text-3xl lg:text-4xl font-bold text-[#22c55e]">
                renda passiva de {investmentTableData[investmentTableData.length - 1].mes === 0 ? 'R$ 0,00' : `R$ ${investmentTableData[investmentTableData.length - 1].jurosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedCalculator === 'investment' && investmentChartData.length > 1 && (
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 w-full">
          <h3 className="text-lg font-semibold mb-4">Gráfico de Evolução</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={investmentChartData} margin={{ top: 20, right: 40, left: 0, bottom: 40 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="periodo"
                tick={{ fontSize: 14, fill: '#64748b' }}
                label={{
                  value: 'Mês',
                  position: 'insideBottomRight',
                  offset: -10,
                  fontSize: 16,
                  fill: '#334155'
                }}
              />
              <YAxis
                tick={{ fontSize: 14, fill: '#64748b' }}
                tickFormatter={v => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb', fontSize: 15 }}
                formatter={(value, name) => [
                  `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  name === 'total' ? 'Juros Ganhos' : 'Valor Investido'
                ]}
                labelFormatter={label => `Mês: ${label}`}
              />
              <Legend
                verticalAlign="top"
                align="center"
                iconType="plainline"
                wrapperStyle={{ fontSize: 16, marginBottom: 12 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#22c55e"
                name="Juros Ganhos"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="investido"
                stroke="#2563eb"
                name="Valor Investido"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedCalculator === 'investment' && investmentTableData.length > 1 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Tabela Detalhada</h3>
          <div className="overflow-x-auto">
            <table
              className="min-w-full w-full text-sm border rounded-xl overflow-hidden bg-white"
              style={{ display: 'block' }}
            >
              <thead style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 sticky top-0 z-10 bg-gray-50">Mês</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 sticky top-0 z-10 bg-gray-50">Juros do mês</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 sticky top-0 z-10 bg-gray-50">Total Investido</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 sticky top-0 z-10 bg-gray-50">Total Juros</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 sticky top-0 z-10 bg-gray-50">Total Acumulado</th>
                </tr>
              </thead>
              <tbody style={{ display: 'block', width: '100%', maxHeight: 350, overflowY: 'auto' }}>
                {investmentTableData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                    <td className="px-4 py-2">{row.mes}</td>
                    <td className="px-4 py-2">{row.mes === 0 ? '-' : `R$ ${row.jurosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</td>
                    <td className="px-4 py-2">R$ {row.investido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2">R$ {row.totalJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 font-semibold">R$ {row.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCalculator === 'investment' && investmentTableData.length > 1 && (
        <div className="mt-10 max-w-3xl mx-auto space-y-6 text-gray-800">
          <h2 className="text-lg font-semibold mt-6">Passo a passo para usar a calculadora de juros compostos</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Preencha o campo <b>"valor inicial"</b> com a quantia que você irá investir inicialmente.</li>
            <li>No campo <b>"aporte mensal"</b>, coloque o quanto pretende investir por mês.</li>
            <li>Informe a <b>taxa de juros</b> mensal ou anual do investimento.</li>
            <li>Preencha o campo <b>"período"</b> com o tempo que pretende investir.</li>
            <li>O resultado será exibido automaticamente conforme você preenche os campos.</li>
          </ol>
          <p>
            Abaixo, você pode visualizar um gráfico detalhado de como seu dinheiro pode render ao longo do tempo, além de uma tabela mês a mês com todos os valores calculados automaticamente.
          </p>
          <h3 className="text-lg font-semibold mt-6">Como funciona o cálculo de juros compostos?</h3>
          <p>
            A fórmula dos juros compostos é: <b>M = C (1+i)<sup>t</sup></b><br />
            Onde:<br />
            <b>M</b> = montante final<br />
            <b>C</b> = capital investido<br />
            <b>i</b> = taxa de juros (em decimal)<br />
            <b>t</b> = tempo do investimento
          </p>
          <p>
            Lembre-se: se usar taxa mensal, o tempo deve estar em meses. Se usar taxa anual, o tempo deve estar em anos.
          </p>
          <h3 className="text-lg font-semibold mt-6">Onde os juros compostos são aplicados?</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Investimentos de renda fixa (CDBs, Tesouro Direto, etc.)</li>
            <li>Empréstimos e financiamentos</li>
            <li>Parcelamentos e contas em atraso</li>
            <li>Reinvestimento de dividendos em ações</li>
          </ul>
          <h3 className="text-lg font-semibold mt-6">Diferença entre juros simples e compostos</h3>
          <p>
            <b>Juros simples:</b> calculados apenas sobre o valor inicial.<br />
            <b>Juros compostos:</b> calculados sobre o valor inicial + juros acumulados (juros sobre juros).
          </p>
          <p>
            No longo prazo, os juros compostos fazem uma enorme diferença no crescimento do seu patrimônio!
          </p>
          <div className="mt-8 flex flex-col items-center">
            <span className="block text-2xl md:text-3xl font-bold mb-4 text-gray-800 text-center">Quer aprender a investir com quem realmente entende do assunto?</span>
            <a
              href="https://form.auvp.com.br/to/EtiSlsEr?indicacao=rony.campinas@hotmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src="/assets/aulas-auvp.png"
                alt="AUVP - A maior escola de investimentos do Brasil"
                className="rounded-lg shadow-lg max-w-full h-auto mx-auto"
                style={{ maxWidth: 400 }}
              />
            </a>
            <span className="block text-center text-base md:text-lg font-medium text-gray-700 mt-2">AUVP - A maior escola de investimentos do Brasil</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;