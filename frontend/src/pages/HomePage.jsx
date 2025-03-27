import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    // Навигираме към JobsPage с параметъра за търсене
    navigate(`/jobs?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Hero секция */}
      <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-32">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
            Намерете своята перфектна работа
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
            Открийте най-добрите възможности за работа в строителния сектор
          </p>

          {/* Форма за търсене */}
          <form onSubmit={handleSearch} className="mt-12 max-w-xl mx-auto">
            <div className="flex shadow-lg rounded-lg overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Търсете по позиция, локация или компания..."
                className="flex-1 px-6 py-4 bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors"
              >
                Търси
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Останалата част от HomePage */}
    </div>
  );
};

export default HomePage; 