import { Category } from '../types';

export const generateDefaultCategories = (): Category[] => {
  return [
    {
      id: '1',
      name: 'Salário',
      type: 'income',
      color: '#4CAF50',
      icon: 'Briefcase',
      subcategories: [
        { id: '101', name: 'Salário Principal', categoryId: '1' },
        { id: '102', name: 'Bônus', categoryId: '1' },
        { id: '103', name: 'Horas Extras', categoryId: '1' }
      ]
    },
    {
      id: '2',
      name: 'Investimentos',
      type: 'income',
      color: '#2196F3',
      icon: 'TrendingUp',
      subcategories: [
        { id: '201', name: 'Dividendos', categoryId: '2' },
        { id: '202', name: 'Juros', categoryId: '2' },
        { id: '203', name: 'Aluguéis', categoryId: '2' }
      ]
    },
    {
      id: '3',
      name: 'Outros Recebimentos',
      type: 'income',
      color: '#9C27B0',
      icon: 'Gift',
      subcategories: [
        { id: '301', name: 'Presentes', categoryId: '3' },
        { id: '302', name: 'Reembolsos', categoryId: '3' },
        { id: '303', name: 'Vendas', categoryId: '3' }
      ]
    },
    {
      id: '4',
      name: 'Moradia',
      type: 'expense',
      color: '#F44336',
      icon: 'Home',
      subcategories: [
        { id: '401', name: 'Aluguel', categoryId: '4' },
        { id: '402', name: 'Condomínio', categoryId: '4' },
        { id: '403', name: 'Energia', categoryId: '4' },
        { id: '404', name: 'Água', categoryId: '4' },
        { id: '405', name: 'Internet', categoryId: '4' },
        { id: '406', name: 'Gás', categoryId: '4' },
        { id: '407', name: 'Manutenção', categoryId: '4' }
      ]
    },
    {
      id: '5',
      name: 'Alimentação',
      type: 'expense',
      color: '#FF9800',
      icon: 'Utensils',
      subcategories: [
        { id: '501', name: 'Supermercado', categoryId: '5' },
        { id: '502', name: 'Restaurantes', categoryId: '5' },
        { id: '503', name: 'Delivery', categoryId: '5' }
      ]
    },
    {
      id: '6',
      name: 'Transporte',
      type: 'expense',
      color: '#3F51B5',
      icon: 'Car',
      subcategories: [
        { id: '601', name: 'Combustível', categoryId: '6' },
        { id: '602', name: 'Transporte Público', categoryId: '6' },
        { id: '603', name: 'Manutenção do Veículo', categoryId: '6' },
        { id: '604', name: 'Estacionamento', categoryId: '6' },
        { id: '605', name: 'Aplicativos de Transporte', categoryId: '6' }
      ]
    },
    {
      id: '7',
      name: 'Saúde',
      type: 'expense',
      color: '#E91E63',
      icon: 'Heart',
      subcategories: [
        { id: '701', name: 'Plano de Saúde', categoryId: '7' },
        { id: '702', name: 'Medicamentos', categoryId: '7' },
        { id: '703', name: 'Consultas', categoryId: '7' },
        { id: '704', name: 'Exames', categoryId: '7' }
      ]
    },
    {
      id: '8',
      name: 'Educação',
      type: 'expense',
      color: '#00BCD4',
      icon: 'BookOpen',
      subcategories: [
        { id: '801', name: 'Mensalidade', categoryId: '8' },
        { id: '802', name: 'Livros', categoryId: '8' },
        { id: '803', name: 'Cursos', categoryId: '8' },
        { id: '804', name: 'Material Escolar', categoryId: '8' }
      ]
    },
    {
      id: '9',
      name: 'Lazer',
      type: 'expense',
      color: '#795548',
      icon: 'Music',
      subcategories: [
        { id: '901', name: 'Assinaturas', categoryId: '9' },
        { id: '902', name: 'Cinema/Teatro', categoryId: '9' },
        { id: '903', name: 'Viagens', categoryId: '9' },
        { id: '904', name: 'Eventos', categoryId: '9' }
      ]
    },
    {
      id: '10',
      name: 'Compras',
      type: 'expense',
      color: '#009688',
      icon: 'ShoppingBag',
      subcategories: [
        { id: '1001', name: 'Roupas', categoryId: '10' },
        { id: '1002', name: 'Eletrônicos', categoryId: '10' },
        { id: '1003', name: 'Presentes', categoryId: '10' },
        { id: '1004', name: 'Decoração', categoryId: '10' }
      ]
    }
  ];
};

export const defaultCurrencies = [
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro' },
  { code: 'USD', symbol: '$', name: 'Dólar Americano' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina' }
];