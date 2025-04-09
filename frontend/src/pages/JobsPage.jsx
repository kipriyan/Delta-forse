import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/config';
import JobApplyModal from '../components/JobApplyModal';

const JobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const industries = [
    "IT и Технологии",
    "Финанси и Счетоводство",
    "Маркетинг и Реклама",
    "Продажби",
    "Човешки ресурси",
    "Административни дейности",
    "Строителство и Архитектура",
    "Производство",
    "Логистика и Транспорт",
    "Медицина и Фармация",
    "Образование",
    "Туризъм и Хотелиерство",
    "Търговия",
    "Инженерство",
    "Право и Юридически услуги",
    "Изкуство и Култура",
    "Медии и Комуникации",
    "Недвижими имоти",
    "Ресторантьорство",
    "Консултантски услуги"
  ];

  const categories = [
    "Софтуерна Разработка",
    "Системна Администрация",
    "Мрежова Администрация",
    "Дизайн",
    "Дигитален Маркетинг",
    "Счетоводство",
    "Одит",
    "Банково Дело",
    "Застраховане",
    "Продажби",
    "Обслужване на клиенти",
    "Човешки Ресурси",
    "Административна Поддръжка",
    "Проектен Мениджмънт",
    "Бизнес Анализ",
    "Данъчно Облагане",
    "Строителство",
    "Архитектура",
    "Инженерство",
    "Производство",
    "Качествен Контрол",
    "Логистика",
    "Транспорт",
    "Складова Дейност",
    "Медицина",
    "Фармация",
    "Образование и Обучение",
    "Хотелиерство",
    "Ресторантьорство",
    "Туризъм",
    "Право",
    "Преводачески Услуги",
    "Журналистика",
    "Медии",
    "Реклама",
    "Недвижими Имоти",
    "Консултантски Услуги",
    "Охрана и Сигурност",
    "Почистване",
    "Друго"
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${API_URL}/jobs`);
        if (response.data.success) {
          const formattedJobs = response.data.data.map(job => ({
            id: job._id || job.id,
            position: job.title || 'Няма заглавие',
            company: job.company || 'Компания',
            type: job.job_type || 'Пълен работен ден',
            location: job.location || 'Няма локация',
            salary: job.salary || 'По договаряне',
            skills: job.requirements || 'Не са посочени',
            description: job.description || 'Няма описание'
          }));
          setJobs(formattedJobs);
        }
      } catch (err) {
        setError('Грешка при зареждане на обявите');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleSaveJob = async (jobId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (savedJobs.has(jobId)) {
        await axios.delete(`${API_URL}/saved-jobs/${jobId}`);
        setSavedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else {
        await axios.post(`${API_URL}/saved-jobs`, { job_id: jobId });
        setSavedJobs(prev => new Set(prev).add(jobId));
      }
    } catch (error) {
      console.error('Error toggling saved job:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchQuery });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex-grow">
        <div className="relative max-w-7xl mx-auto px-4 h-[300px] flex items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">
              Всички обяви за работа
            </h1>
            <p className="text-xl text-gray-200">
              Намерете следващото си професионално предизвикателство
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="mb-8">
            <form onSubmit={handleSearch} className="max-w-3xl">
              <div className="flex shadow-lg rounded-lg overflow-hidden">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Търсете по позиция, локация или компания..."
                  className="flex-1 px-6 py-3 bg-gray-700 text-white placeholder-gray-400 focus:outline-none border-none"
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors"
                >
                  Търси
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/4 bg-gray-800 p-4 rounded-lg shadow-md h-fit">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Филтри</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Локация</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 shadow-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-500 placeholder-gray-400"
                    placeholder="Въведете град"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Индустрия</label>
                  <select className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 shadow-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-500">
                    <option value="">Всички индустрии</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Категория</label>
                  <select className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 shadow-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-500">
                    <option value="">Всички категории</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Тип заетост</label>
                  <select className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 shadow-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-500">
                    <option value="">Всички</option>
                    <option value="full-time">Пълен работен ден</option>
                    <option value="part-time">Непълен работен ден</option>
                    <option value="remote">Дистанционна работа</option>
                    <option value="contract">Договор</option>
                    <option value="internship">Стаж</option>
                    <option value="temporary">Временна заетост</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="w-full md:w-3/4 space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-white">Зареждане...</div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-500">{error}</div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400">Няма намерени обяви</div>
                </div>
              ) : (
                jobs.map(job => (
                  <div key={job.id} className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-200">{job.position}</h3>
                        <p className="text-gray-400 mt-1">{job.company}</p>
                      </div>
                      <div className="flex items-start space-x-4">
                        <button
                          onClick={(e) => handleSaveJob(job.id, e)}
                          className="text-gray-400 hover:text-yellow-300 transition-colors duration-300"
                        >
                          <svg 
                            className="w-6 h-6" 
                            fill={savedJobs.has(job.id) ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={savedJobs.has(job.id) ? "0" : "2"} 
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        </button>
                        <span className="bg-gray-700 text-gray-300 text-sm font-medium px-2.5 py-0.5 rounded">
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-400 space-x-4">
                      <span>{job.location}</span>
                      <span>{job.salary}</span>
                      <span>{job.skills}</span>
                    </div>
                    <p className="mt-4 text-gray-300">
                      {job.description}
                    </p>
                    <button 
                      onClick={() => setSelectedJob(job)}
                      className="mt-4 text-gray-300 hover:text-gray-100 font-medium transition-colors duration-300"
                    >
                      Кандидатствай →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedJob && (
        <JobApplyModal
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
};

export default JobsPage; 