import React, { useState } from 'react';
import { Calculator as CalculatorIcon, RefreshCw } from 'lucide-react';

const Calculator: React.FC = () => {
  const [selectedCalculator, setSelectedCalculator] = useState<'investment' | 'loan'>('investment');
  
  // Investment calculator state
  const [investmentData, setInvestmentData] = useState({
    initialAmount: 0,
    monthlyContribution: 0,
    interestRate: 0,
    period: 0,
  });
  
  // Loan calculator state
  const [loanData, setLoanData] = useState({
    loanAmount: 0,
    interestRate: 0,
    period: 0,
  });
  
  // Investment calculation
  const calculateInvestment = () => {
    const { initialAmount, monthlyContribution, interestRate, period } = investmentData;
    const monthlyRate = interestRate / 100 / 12;
    const months = period * 12;
    
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
    const monthlyRate = interestRate / 100 / 12;
    const months = period * 12;
    
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
    }).format(value);
  };
  
  const handleInvestmentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvestmentData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };
  
  const handleLoanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoanData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };
  
  const investmentResults = calculateInvestment();
  const loanResults = calculateLoan();

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
                    type="number"
                    id="initialAmount"
                    name="initialAmount"
                    value={investmentData.initialAmount}
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
                    type="number"
                    id="monthlyContribution"
                    name="monthlyContribution"
                    value={investmentData.monthlyContribution}
                    onChange={handleInvestmentInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Taxa de Juros (% ao ano)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="interestRate"
                    name="interestRate"
                    value={investmentData.interestRate}
                    onChange={handleInvestmentInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                  Período (anos)
                </label>
                <input
                  type="number"
                  id="period"
                  name="period"
                  value={investmentData.period}
                  onChange={handleInvestmentInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
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
                    type="number"
                    id="loanAmount"
                    name="loanAmount"
                    value={loanData.loanAmount}
                    onChange={handleLoanInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Taxa de Juros (% ao ano)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="interestRate"
                    name="interestRate"
                    value={loanData.interestRate}
                    onChange={handleLoanInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                  Período (anos)
                </label>
                <input
                  type="number"
                  id="period"
                  name="period"
                  value={loanData.period}
                  onChange={handleLoanInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
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
                <p className="text-sm text-blue-700 font-medium">Valor Final</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(investmentResults.futureValue)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">Total Investido</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(investmentResults.totalInvested)}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="text-sm text-purple-700 font-medium">Juros Ganhos</p>
                  <p className="text-xl font-bold text-purple-600">
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
    </div>
  );
};

export default Calculator;