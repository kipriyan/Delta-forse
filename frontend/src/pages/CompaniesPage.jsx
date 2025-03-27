import React, { useState } from 'react';

const CompaniesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');

  // Примерни данни за компании
  const companies = [
    {
      id: 1,
      name: 'ТехСофт ООД',
      industry: 'IT',
      location: 'София',
      logo: 'https://placehold.co/100x100',
      description: 'Водеща софтуерна компания с над 10 години опит в разработката на бизнес решения.',
      employeeCount: '50-100',
      openPositions: 5
    },
    {
      id: 2,
      name: 'МаркетПро АД',
      industry: 'Маркетинг',
      location: 'Пловдив',
      logo: 'https://placehold.co/100x100',
      description: 'Дигитална маркетинг агенция, специализирана в онлайн реклама и SEO оптимизация.',
      employeeCount: '20-50',
      openPositions: 3
    },
    // Можете да добавите още примерни компании тук
  ];

  const industries = ['IT', 'Маркетинг', 'Финанси', 'Производство', 'Търговия'];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !selectedIndustry || company.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex-grow">
        {/* Хедър секция */}
        <div className="relative max-w-7xl mx-auto px-4 h-[200px] flex flex-col justify-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Компании
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl">
            Открийте своя бъдещ работодател
          </p>
        </div>

        {/* Търсачка и филтри */}
        <div className="max-w-7xl mx-auto px-4 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <input
              type="text"
              placeholder="Търсене на компании..."
              className="w-full px-4 py-2 border border-gray-600 rounded-md bg-gray-800 text-gray-200 focus:ring-gray-600 focus:border-gray-500 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="w-full px-4 py-2 border border-gray-600 rounded-md bg-gray-800 text-gray-200 focus:ring-gray-600 focus:border-gray-500"
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
            >
              <option value="">Всички индустрии</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Списък с компании */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCompanies.map(company => (
              <div key={company.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <img
                      src={company.logo}
                      alt={`${company.name} logo`}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-200">{company.name}</h2>
                      <p className="text-sm text-gray-400">{company.industry}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-300">{company.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                      {company.location}
                    </span>
                    <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                      {company.employeeCount} служители
                    </span>
                    <span className="px-3 py-1 bg-gray-600 text-gray-200 rounded-full text-sm">
                      {company.openPositions} отворени позиции
                    </span>
                  </div>
                  <button className="w-full bg-gray-700 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">
                    Виж профила
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Съобщение, ако няма намерени компании */}
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Няма намерени компании, отговарящи на критериите за търсене.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage; 