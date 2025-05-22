import React, { useState } from 'react';
import { Calculator as CalculatorIcon, RefreshCw } from 'lucide-react';
import { formatCurrencyInput } from '../utils/helpers';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const isMobileWidth = (w: number) => w < 640;

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
  
  const { width } = useWindowSize();
  const isMobile = isMobileWidth(width);
  
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
    <div className="space-y-4 sm:space-y-6 px-1.5 sm:px-4 md:px-8">
      <h1 className="text-lg sm:text-2xl font-bold text-gray-800 text-center dark:text-white">Calculadoras Financeiras</h1>
      
      {/* Calculator Type Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5 sm:p-3 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
          <button 
            onClick={() => setSelectedCalculator('investment')}
            className={`w-full sm:flex-1 px-3 sm:px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${
              selectedCalculator === 'investment' 
                ? 'bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 dark:from-blue-900 dark:to-blue-700 dark:hover:from-blue-800 dark:hover:to-blue-900' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <CalculatorIcon size={16} />
            Investimentos
          </button>
          <button 
            onClick={() => setSelectedCalculator('loan')}
            className={`w-full sm:flex-1 px-3 sm:px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${
              selectedCalculator === 'loan' 
                ? 'bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-xl shadow font-semibold hover:from-blue-500 hover:to-blue-800 dark:from-blue-900 dark:to-blue-700 dark:hover:from-blue-800 dark:hover:to-blue-900' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <RefreshCw size={16} />
            Empréstimos
          </button>
        </div>
      </div>
      
      {/* Calculator Content */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-2.5 sm:p-6 w-full dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 dark:text-white">
            {selectedCalculator === 'investment' ? 'Calculadora de Investimentos' : 'Calculadora de Empréstimos'}
          </h2>
          
          {selectedCalculator === 'investment' ? (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="initialAmount" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Valor Inicial
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-300">R$</span>
                  <input
                    type="text"
                    id="initialAmount"
                    name="initialAmount"
                    value={investmentData.displayInitialAmount}
                    onChange={handleInvestmentInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base dark:bg-gray-900 dark:text-white dark:border-gray-800"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="monthlyContribution" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Aporte Mensal
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-300">R$</span>
                  <input
                    type="text"
                    id="monthlyContribution"
                    name="monthlyContribution"
                    value={investmentData.displayMonthlyContribution}
                    onChange={handleInvestmentInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base dark:bg-gray-900 dark:text-white dark:border-gray-800"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Taxa de Juros (%)
                </label>
                <div className="flex gap-2 items-center flex-col sm:flex-row">
                  <input
                    type="text"
                    id="interestRate"
                    name="interestRate"
                    value={investmentData.displayInterestRate}
                    onChange={handleInvestmentInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base dark:bg-gray-900 dark:text-white dark:border-gray-800"
                  />
                  <select
                    value={investmentRateUnit}
                    onChange={(e) => setInvestmentRateUnit(e.target.value as 'ano' | 'mes')}
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base dark:bg-gray-900 dark:text-white dark:border-gray-800"
                  >
                    <option value="ano">Ano</option>
                    <option value="mes">Mês</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Período
                </label>
                <div className="flex gap-2 items-center flex-col sm:flex-row">
                  <input
                    type="text"
                    id="period"
                    name="period"
                    value={investmentData.displayPeriod}
                    onChange={handleInvestmentInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base dark:bg-gray-900 dark:text-white dark:border-gray-800"
                  />
                  <select
                    value={investmentPeriodUnit}
                    onChange={(e) => setInvestmentPeriodUnit(e.target.value as 'anos' | 'meses')}
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base dark:bg-gray-900 dark:text-white dark:border-gray-800"
                  >
                    <option value="anos">Anos</option>
                    <option value="meses">Meses</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Valor do Empréstimo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-300">R$</span>
                  <input
                    type="text"
                    id="loanAmount"
                    name="loanAmount"
                    value={loanData.displayLoanAmount}
                    onChange={handleLoanInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base dark:bg-gray-900 dark:text-white dark:border-gray-800"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Taxa de Juros (%)
                </label>
                <div className="flex gap-2 items-center flex-col sm:flex-row">
                  <input
                    type="text"
                    id="interestRate"
                    name="interestRate"
                    value={loanData.displayInterestRate}
                    onChange={handleLoanInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base dark:bg-gray-900 dark:text-white dark:border-gray-800"
                  />
                  <select
                    value={loanRateUnit}
                    onChange={(e) => setLoanRateUnit(e.target.value as 'ano' | 'mes')}
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base dark:bg-gray-900 dark:text-white dark:border-gray-800"
                  >
                    <option value="ano">Ano</option>
                    <option value="mes">Mês</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  Período
                </label>
                <div className="flex gap-2 items-center flex-col sm:flex-row">
                  <input
                    type="text"
                    id="period"
                    name="period"
                    value={loanData.displayPeriod}
                    onChange={handleLoanInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base dark:bg-gray-900 dark:text-white dark:border-gray-800"
                  />
                  <select
                    value={loanPeriodUnit}
                    onChange={(e) => setLoanPeriodUnit(e.target.value as 'anos' | 'meses')}
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base dark:bg-gray-900 dark:text-white dark:border-gray-800"
                  >
                    <option value="anos">Anos</option>
                    <option value="meses">Meses</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          {/* Resultado destacado no mobile */}
          {isMobile && selectedCalculator === 'investment' && investmentTableData.length > 1 && (
            <div className="w-full flex justify-center my-3">
              <div className="relative w-full">
                <Confetti width={width} height={160} numberOfPieces={220} recycle={false} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} />
                <div className="text-center w-full relative z-10">
                  <span className="block text-base font-semibold text-gray-800 mb-1">
                    No final de {investmentTableData[investmentTableData.length - 1].mes} meses você terá uma
                  </span>
                  <span className="block text-lg font-bold text-[#22c55e]">
                    renda passiva de {investmentTableData[investmentTableData.length - 1].mes === 0 ? 'R$ 0,00' : `R$ ${investmentTableData[investmentTableData.length - 1].jurosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Results */}
        <div className="bg-white rounded-xl border border-gray-200 p-2.5 sm:p-6 w-full dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 dark:text-white">Resultados</h2>
          
          {selectedCalculator === 'investment' ? (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center dark:bg-blue-900 dark:border-blue-800">
                <p className="text-sm font-semibold mb-1 text-[#7c3aed] dark:text-blue-200">Valor Final</p>
                <p className="text-lg sm:text-xl font-bold text-[#7c3aed] dark:text-blue-200">
                  {formatCurrency(investmentResults.futureValue)}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center dark:bg-blue-900 dark:border-blue-800">
                  <p className="text-sm font-semibold mb-1 text-[#2563eb] dark:text-blue-300">Total Investido</p>
                  <p className="text-lg sm:text-xl font-bold text-[#2563eb] dark:text-blue-200">
                    {formatCurrency(investmentResults.totalInvested)}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg text-center dark:bg-purple-900 dark:border-purple-800">
                  <p className="text-sm font-semibold mb-1 text-[#22c55e] dark:text-green-300">Juros Ganhos</p>
                  <p className="text-lg sm:text-xl font-bold text-[#22c55e] dark:text-green-300">
                    {formatCurrency(investmentResults.interestEarned)}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-800">
                  <div 
                    className="h-full bg-blue-500 dark:bg-blue-700"
                    style={{ 
                      width: `${(investmentResults.totalInvested / investmentResults.futureValue) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 dark:text-gray-300">
                  <span>Principal</span>
                  <span>Juros</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center dark:bg-blue-900 dark:border-blue-800">
                <p className="text-sm text-blue-700 font-medium dark:text-blue-300">Parcela Mensal</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-200">
                  {formatCurrency(loanResults.monthlyPayment)}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-center dark:bg-red-900 dark:border-red-800">
                  <p className="text-sm text-red-700 font-medium dark:text-red-300">Total a Pagar</p>
                  <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-200">
                    {formatCurrency(loanResults.totalPayment)}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg text-center dark:bg-purple-900 dark:border-purple-800">
                  <p className="text-sm text-purple-700 font-medium dark:text-purple-300">Total de Juros</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-200">
                    {formatCurrency(loanResults.totalInterest)}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-800">
                  <div 
                    className="h-full bg-red-500 dark:bg-red-700"
                    style={{ 
                      width: `${(loanData.loanAmount / loanResults.totalPayment) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 dark:text-gray-300">
                  <span>Principal</span>
                  <span>Juros</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Destaque de renda passiva com confete no desktop */}
      {!isMobile && selectedCalculator === 'investment' && investmentTableData.length > 1 && (
        <div className="w-full flex justify-center my-6 sm:my-8">
          <div className="relative w-full max-w-2xl">
            <Confetti width={width} height={200} numberOfPieces={300} recycle={false} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} />
            <div className="text-center w-full relative z-10">
              <span className="block text-xl md:text-2xl font-semibold text-gray-800 mb-1 dark:text-white">
                No final de {investmentTableData[investmentTableData.length - 1].mes} meses você terá uma
              </span>
              <span className="block text-2xl md:text-3xl lg:text-4xl font-bold text-[#22c55e] dark:text-green-300">
                renda passiva de {investmentTableData[investmentTableData.length - 1].mes === 0 ? 'R$ 0,00' : `R$ ${investmentTableData[investmentTableData.length - 1].jurosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedCalculator === 'investment' && investmentChartData.length > 1 && (
        <div className="mt-6 sm:mt-8 bg-white rounded-xl border border-gray-200 p-2 sm:p-6 w-full overflow-x-auto dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Gráfico de Evolução</h3>
          <div className="w-full min-w-[320px]" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={investmentChartData} margin={{ top: 20, right: 24, left: 24, bottom: 40 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  label={{
                    value: 'Mês',
                    position: 'insideBottomRight',
                    offset: -10,
                    fontSize: 14,
                    fill: '#334155'
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={v => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb', fontSize: 13 }}
                  formatter={(value, name) => [
                    `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    name === 'total' ? 'Juros Ganhos' : 'Valor Investido'
                  ]}
                  labelFormatter={label => `Mês: ${label}`}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="plainline"
                  wrapperStyle={{ fontSize: 14, marginTop: 8 }}
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
        </div>
      )}

      {selectedCalculator === 'investment' && investmentTableData.length > 1 && (
        <div className="mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Tabela Detalhada</h3>
          <div className="overflow-x-auto w-full">
            <table
              className="min-w-[320px] sm:min-w-[600px] w-full text-xs sm:text-sm border rounded-xl overflow-hidden bg-white dark:bg-gray-900 dark:border-gray-800"
              style={{ display: 'block' }}
            >
              <thead style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                <tr>
                  <th className="px-2 sm:px-4 py-2 text-left font-semibold text-gray-700 sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 dark:text-gray-200">Mês</th>
                  <th className="px-2 sm:px-4 py-2 text-left font-semibold text-gray-700 sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 dark:text-gray-200">Juros do mês</th>
                  <th className="px-2 sm:px-4 py-2 text-left font-semibold text-gray-700 sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 dark:text-gray-200">Total Investido</th>
                  <th className="px-2 sm:px-4 py-2 text-left font-semibold text-gray-700 sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 dark:text-gray-200">Total Juros</th>
                  <th className="px-2 sm:px-4 py-2 text-left font-semibold text-gray-700 sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 dark:text-gray-200">Total Acumulado</th>
                </tr>
              </thead>
              <tbody style={{ display: 'block', width: '100%', maxHeight: 350, overflowY: 'auto' }}>
                {investmentTableData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      (idx % 2 === 0
                        ? 'bg-white dark:bg-gray-900'
                        : 'bg-gray-50 dark:bg-gray-800')
                    }
                    style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}
                  >
                    <td className="px-2 sm:px-4 py-2 dark:text-gray-200">{row.mes}</td>
                    <td className="px-2 sm:px-4 py-2 dark:text-gray-200">{row.mes === 0 ? '-' : `R$ ${row.jurosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</td>
                    <td className="px-2 sm:px-4 py-2 dark:text-gray-200">R$ {row.investido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-2 sm:px-4 py-2 dark:text-gray-200">R$ {row.totalJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-2 sm:px-4 py-2 font-semibold dark:text-gray-100">R$ {row.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCalculator === 'investment' && investmentTableData.length > 1 && (
        <div className="mt-10 max-w-3xl mx-auto space-y-6 text-gray-800 px-2 sm:px-0 dark:text-gray-200">
          <h2 className="text-base sm:text-lg font-semibold mt-6 dark:text-white">Passo a passo para usar a calculadora de juros compostos</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base">
            <li>Preencha o campo <b>"valor inicial"</b> com a quantia que você irá investir inicialmente.</li>
            <li>No campo <b>"aporte mensal"</b>, coloque o quanto pretende investir por mês.</li>
            <li>Informe a <b>taxa de juros</b> mensal ou anual do investimento.</li>
            <li>Preencha o campo <b>"período"</b> com o tempo que pretende investir.</li>
            <li>O resultado será exibido automaticamente conforme você preenche os campos.</li>
          </ol>
          <p className="text-sm sm:text-base">Abaixo, você pode visualizar um gráfico detalhado de como seu dinheiro pode render ao longo do tempo, além de uma tabela mês a mês com todos os valores calculados automaticamente.</p>
          <h3 className="text-base sm:text-lg font-semibold mt-6 dark:text-white">Como funciona o cálculo de juros compostos?</h3>
          <p className="text-sm sm:text-base">A fórmula dos juros compostos é: <b>M = C (1+i)<sup>t</sup></b><br />Onde:<br /><b>M</b> = montante final<br /><b>C</b> = capital investido<br /><b>i</b> = taxa de juros (em decimal)<br /><b>t</b> = tempo do investimento</p>
          <p className="text-sm sm:text-base">Lembre-se: se usar taxa mensal, o tempo deve estar em meses. Se usar taxa anual, o tempo deve estar em anos.</p>
          <h3 className="text-base sm:text-lg font-semibold mt-6 dark:text-white">Onde os juros compostos são aplicados?</h3>
          <ul className="list-disc list-inside space-y-1 text-sm sm:text-base">
            <li>Investimentos de renda fixa (CDBs, Tesouro Direto, etc.)</li>
            <li>Empréstimos e financiamentos</li>
            <li>Parcelamentos e contas em atraso</li>
            <li>Reinvestimento de dividendos em ações</li>
          </ul>
          <h3 className="text-base sm:text-lg font-semibold mt-6 dark:text-white">Diferença entre juros simples e compostos</h3>
          <p className="text-sm sm:text-base"><b>Juros simples:</b> calculados apenas sobre o valor inicial.<br /><b>Juros compostos:</b> calculados sobre o valor inicial + juros acumulados (juros sobre juros).</p>
          <p className="text-sm sm:text-base">No longo prazo, os juros compostos fazem uma enorme diferença no crescimento do seu patrimônio!</p>
          <div className="mt-8 flex flex-col items-center">
            <span className="block text-lg sm:text-2xl md:text-3xl font-bold mb-4 text-gray-800 text-center dark:text-white">Quer aprender a investir com quem realmente entende do assunto?</span>
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
            <span className="block text-center text-base md:text-lg font-medium text-gray-700 mt-2 dark:text-gray-300">AUVP - A maior escola de investimentos do Brasil</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;