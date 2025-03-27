import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">За нас</h3>
              <p className="text-gray-300">
                Намерете своята перфектна работа с помощта на нашата платформа.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Бързи връзки</h3>
              <ul className="space-y-2">
                <li><Link to="/jobs" className="text-gray-300 hover:text-white">Всички обяви</Link></li>
                <li><Link to="/companies" className="text-gray-300 hover:text-white">Компании</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Контакти</h3>
              <p className="text-gray-300">
                Email: kipriyanpanayotov@gmail.com
                <br />
                Тел: +359 87 793 8025
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 