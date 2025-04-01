import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [accountType, setAccountType] = useState('person');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    vatNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAccountTypeChange = (type) => {
    setAccountType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Паролите не съвпадат!');
      return;
    }
    
    // Валидация на полета според типа акаунт
    if (accountType === 'person') {
      if (!formData.firstName || !formData.lastName) {
        setError('Моля, попълнете името и фамилията си.');
        return;
      }
    } else {
      if (!formData.companyName || !formData.vatNumber) {
        setError('Моля, попълнете името на компанията и ЕИК/Булстат.');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Регистрация
      const registerResponse = await AuthService.register({
        ...formData,
        accountType
      });
      
      console.log('Успешна регистрация:', registerResponse);
      
      // Автоматичен вход след регистрация
      try {
        // Подготвяме данните за вход
        const loginData = {
          email: formData.email,
          password: formData.password
        };
        
        // Извикваме функцията за вход
        await login(loginData);
        
        // Пренасочваме към началната страница
        navigate('/');
      } catch (loginErr) {
        console.error('Грешка при автоматичен вход:', loginErr);
        // Въпреки грешката при автоматичния вход, регистрацията е успешна
        // Затова пренасочваме към страницата за вход
        navigate('/login');
      }
    } catch (err) {
      setError(err.error || 'Грешка при регистрация. Моля, опитайте отново.');
      console.error('Грешка при регистрация:', err);
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
              Създаване на профил
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Или{' '}
              <Link to="/login" className="font-medium text-gray-300 hover:text-white">
                влезте в съществуващ профил
              </Link>
            </p>
          </div>

          {/* Тип акаунт */}
          <div className="flex justify-center space-x-4 p-1 bg-gray-700 rounded-lg">
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                accountType === 'person'
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => handleAccountTypeChange('person')}
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
              onClick={() => handleAccountTypeChange('business')}
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
              {accountType === 'person' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Име
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Фамилия
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Име на компанията
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500"
                      value={formData.companyName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      ЕИК/Булстат
                    </label>
                    <input
                      type="text"
                      name="vatNumber"
                      required
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500"
                      value={formData.vatNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Имейл адрес
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500"
                  value={formData.email}
                  onChange={handleChange}
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

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Повторете паролата
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
              >
                {loading ? 'Обработка...' : 'Регистрация'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 