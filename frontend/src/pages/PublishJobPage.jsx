import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/config';
import { useAuth } from '../context/AuthContext';

const PublishJobPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = location.state?.isEditing || false;
  const initialData = {
    title: '',
    company: '',
    location: '',
    workType: '',
    employmentType: 'full-time',
    salary: '',
    hourlyRate: '',
    experience: '',
    industry: '',
    description: '',
    requirements: '',
    category: ''
  };

  const [accountType, setAccountType] = useState('person');
  const [jobData, setJobData] = useState(initialData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJobData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Функция за нормализиране на job_type
      const normalizeJobType = (type) => {
        const validTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
        return validTypes.includes(type) ? type : 'full-time';
      };

      const formattedData = {
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        // Нормализираме job_type преди изпращане
        job_type: normalizeJobType(accountType === 'business' ? jobData.employmentType : jobData.workType),
        salary: accountType === 'business' ? jobData.salary : jobData.hourlyRate,
        requirements: accountType === 'business' ? jobData.requirements : jobData.experience
      };

      // Добавяме лог за дебъгване
      console.log('Job type before sending:', formattedData.job_type);

      // Валидации...
      if (!formattedData.title || formattedData.title.length < 5) {
        setError('Заглавието трябва да е поне 5 символа');
        return;
      }

      if (!formattedData.description || formattedData.description.length < 10) {
        setError('Описанието трябва да е поне 10 символа');
        return;
      }

      if (!formattedData.location) {
        setError('Локацията е задължителна');
        return;
      }

      if (!formattedData.salary || !/^\d+-\d+$|^\d+$/.test(formattedData.salary)) {
        setError('Невалиден формат за заплата');
        return;
      }

      // Проверяваме дали job_type е валиден
      if (!formattedData.job_type) {
        setError('Моля, изберете тип на работата');
        return;
      }

      console.log('Sending formatted data:', formattedData);

      const response = await axios.post(
        `${API_URL}/jobs`,
        formattedData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        navigate('/my-jobs');
      } else {
        setError(response.data.error || 'Възникна грешка при публикуване на обявата');
      }
    } catch (error) {
      console.error('Error publishing job:', error.response?.data || error.message);
      setError(
        error.response?.data?.error || 
        'Възникна грешка при публикуване на обявата. Моля, опитайте отново.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex-grow">
        <div className="relative max-w-7xl mx-auto px-4 h-[200px] flex items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">
              {isEditing ? 'Редактиране на обява' : 'Публикуване на обява'}
            </h1>
            <p className="text-xl text-gray-200">
              {isEditing ? 'Редактирайте детайлите на вашата обява' : 'Създайте нова обява за работа'}
            </p>
          </div>
        </div>

        {/* Избор на тип акаунт */}
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="flex space-x-4 justify-center">
            <button
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                accountType === 'person'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
              onClick={() => setAccountType('person')}
            >
              Физическо лице
            </button>
            <button
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                accountType === 'business'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
              onClick={() => setAccountType('business')}
            >
              Фирма
            </button>
          </div>
        </div>

        {/* Форма */}
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-xl space-y-6">
            {/* Общи полета */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Заглавие на обявата
              </label>
              <input
                type="text"
                name="title"
                value={jobData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Локация
              </label>
              <input
                type="text"
                name="location"
                value={jobData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400"
                required
              />
            </div>

            {accountType === 'person' ? (
              // Форма за физически лица
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Вид работа
                  </label>
                  <select
                    name="workType"
                    value={jobData.workType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                    required
                  >
                    <option value="">Изберете вид работа</option>
                    <option value="full-time">Пълен работен ден</option>
                    <option value="part-time">Непълен работен ден</option>
                    <option value="contract">Договор</option>
                    <option value="internship">Стаж</option>
                    <option value="remote">Дистанционна работа</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Опит
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={jobData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400"
                    placeholder="напр. 5 години в строителството"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Заплащане
                  </label>
                  <input
                    type="text"
                    name="hourlyRate"
                    value={jobData.hourlyRate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400"
                    placeholder="напр. 20 лв/час"
                    required
                  />
                </div>
              </>
            ) : (
              // Форма за фирми
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Име на фирмата
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={jobData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Индустрия
                  </label>
                  <select
                    name="industry"
                    value={jobData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                    required
                  >
                    <option value="">Изберете индустрия</option>
                    <option value="construction">Строителство</option>
                    <option value="manufacturing">Производство</option>
                    <option value="services">Услуги</option>
                    <option value="retail">Търговия</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Тип заетост
                  </label>
                  <select
                    name="employmentType"
                    value={jobData.employmentType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                    required
                  >
                    <option value="">Изберете тип заетост</option>
                    <option value="full-time">Пълен работен ден</option>
                    <option value="part-time">Непълен работен ден</option>
                    <option value="contract">Договор</option>
                    <option value="internship">Стаж</option>
                    <option value="remote">Дистанционна работа</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Заплата
                  </label>
                  <input
                    type="text"
                    name="salary"
                    value={jobData.salary}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400"
                    placeholder="напр. 2000-3000 лв."
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Описание
              </label>
              <textarea
                name="description"
                value={jobData.description}
                onChange={handleChange}
                rows="6"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400"
                required
              ></textarea>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/my-jobs')}
                className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Отказ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading 
                  ? 'Публикуване...' 
                  : (isEditing ? 'Запази промените' : 'Публикувай обява')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublishJobPage; 