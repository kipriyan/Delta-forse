import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('person');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    ...(accountType === 'business' ? { vatNumber: '' } : {})
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await login(formData);
      console.log("Login successful:", response);
      navigate('/');
    } catch (err) {
      console.error('Грешка при вход:', err);
      setError(err.error || 'Неуспешен вход. Моля, проверете вашите данни.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-xl">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Вход в профила
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Или{' '}
              <Link to="/register" className="font-medium text-gray-300 hover:text-white">
                създайте нов профил
              </Link>
            </p>
          </div>

          <div className="flex justify-center space-x-4 p-1 bg-gray-700 rounded-lg">
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                accountType === 'person'
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setAccountType('person')}
            >
              Физическо лице
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                accountType === 'business'
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setAccountType('business')}
            >
              Бизнес
            </button>
          </div>

          {error && (
            <div className="bg-red-900 text-white p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              {accountType === 'business' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    ЕИК/Булстат
                  </label>
                  <input
                    type="text"
                    name="vatNumber"
                    required
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500"
                    value={formData.vatNumber || ''}
                    onChange={handleChange}
                    placeholder="Въведете ЕИК/Булстат"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  {accountType === 'business' ? 'Фирмен имейл' : 'Имейл адрес'}
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={accountType === 'business' ? 'company@example.com' : 'your@email.com'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Парола
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-gray-600 focus:ring-gray-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Запомни ме
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-gray-300 hover:text-white">
                  Забравена парола?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200`}
              >
                {loading ? 'Обработка...' : 'Вход'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 