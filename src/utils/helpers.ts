// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'BRL'): string => {
  // List of valid currency codes
  const validCurrencies = ['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD'];
  
  // If currency is invalid or not provided, default to BRL
  const validCurrency = validCurrencies.includes(currency) ? currency : 'BRL';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: validCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string): string => {
  // Add timezone offset to keep the date unchanged
  const date = new Date(dateString);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + timezoneOffset);
  
  return new Intl.DateTimeFormat('pt-BR').format(adjustedDate);
};

// Format date for input field (YYYY-MM-DD)
export const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + timezoneOffset);
  return adjustedDate.toISOString().split('T')[0];
};

// Get current date in ISO format (YYYY-MM-DD)
export const getCurrentDate = (): string => {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + timezoneOffset);
  return adjustedDate.toISOString().split('T')[0];
};

// Get first day of current month
export const getFirstDayOfMonth = (): string => {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const timezoneOffset = firstDay.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(firstDay.getTime() + timezoneOffset);
  return adjustedDate.toISOString().split('T')[0];
};

// Get last day of current month
export const getLastDayOfMonth = (): string => {
  const date = new Date();
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const timezoneOffset = lastDay.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(lastDay.getTime() + timezoneOffset);
  return adjustedDate.toISOString().split('T')[0];
};

// Get month name
export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthIndex];
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Group transactions by category
export const groupTransactionsByCategory = (
  transactions: any[], 
  categories: any[]
) => {
  const grouped = transactions.reduce((acc, transaction) => {
    const categoryId = transaction.categoryId;
    if (!acc[categoryId]) {
      acc[categoryId] = {
        total: 0,
        transactions: []
      };
    }
    acc[categoryId].total += transaction.amount;
    acc[categoryId].transactions.push(transaction);
    return acc;
  }, {});
  
  return Object.entries(grouped).map(([categoryId, data]) => ({
    category: categories.find(c => c.id === categoryId),
    total: (data as any).total,
    transactions: (data as any).transactions
  }));
};

// Calculate spending trend (comparing current month to previous month)
export const calculateSpendingTrend = (
  currentMonthTransactions: any[],
  previousMonthTransactions: any[]
): number => {
  const currentTotal = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const previousTotal = previousMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  if (previousTotal === 0) return 0;
  
  return ((currentTotal - previousTotal) / previousTotal) * 100;
};

// Máscara para telefone brasileiro
export const formatPhone = (value: string): string => {
  // Remove tudo que não for número
  let cleaned = value.replace(/\D/g, '');
  // Aplica a máscara
  if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);
  if (cleaned.length > 10) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length > 6) {
    return cleaned.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
  } else if (cleaned.length > 2) {
    return cleaned.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  } else {
    return cleaned;
  }
};