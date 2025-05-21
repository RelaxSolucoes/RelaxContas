import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/');
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Painel visual à esquerda */}
      <div className="hidden md:flex md:w-1/2 bg-blue-700 text-white flex-col justify-center items-center p-10 relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center mb-8">
            <span className="text-2xl font-bold tracking-tight">RelaxContas</span>
          </div>
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold mb-2">Rápido, fácil e seguro</h2>
            <p className="text-lg opacity-90">Gerencie suas contas, pagamentos e recebimentos em um só lugar. Simples, moderno e eficiente.</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-xl p-6 shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-green-400 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">✓</div>
              <div>
                <div className="font-semibold">Transferência realizada</div>
                <div className="text-xs opacity-80">R$ 2.500,00</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">$</div>
              <div>
                <div className="font-semibold">Pagamento recebido</div>
                <div className="text-xs opacity-80">R$ 1.200,00</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 opacity-20 w-64 h-64 bg-white rounded-full blur-3xl z-0" />
      </div>
      {/* Formulário à direita */}
      <div className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Entrar na sua conta</h2>
            <p className="mt-2 text-sm text-gray-600">
              Ou{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                criar uma nova conta
              </Link>
            </p>
          </div>
          {/* Botões sociais (apenas visual, sem funcionalidade extra) */}
          <div className="flex flex-col gap-3">
            <button type="button" className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 font-medium hover:bg-gray-50 transition">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> Entrar com Google
            </button>
            <button type="button" className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 font-medium hover:bg-gray-50 transition">
              <img src="https://www.svgrepo.com/show/303128/apple-logo.svg" alt="Apple" className="w-5 h-5" /> Entrar com Apple
            </button>
          </div>
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-2 text-gray-400 text-xs">ou com email</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Lembrar-me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Esqueceu sua senha?
                </a>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;