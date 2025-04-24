import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navLinks = [
    { to: "/jobs", text: "ОБЯВИ" },,
    { to: "/my-jobs", text: "МОИТЕ ОБЯВИ" },
    { to: "/equipment", text: "ЕКИПИРОВКА" },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-white hover:text-gray-200 transition-colors duration-300">
                JobPortal
              </span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  {link.text}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link 
              to="/publish-job" 
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              ПУБЛИКУВАЙ ОБЯВА
            </Link>
            
            {user ? (
              <>
                <span className="text-gray-300 px-3 py-2 text-sm font-medium">
                  {user.username}
                </span>
                <button 
                  onClick={handleLogout}
                  className="bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  ИЗХОД
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  ВХОД
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  РЕГИСТРАЦИЯ
                </Link>
              </>
            )}
          </div>

          {/* Мобилен бутон за меню */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none transition-colors duration-300"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Мобилно меню */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-300"
                >
                  {link.text}
                </Link>
              ))}
              {user ? (
                <>
                  <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-300">
                    {user.username}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-gray-700 text-white hover:bg-gray-600 transition-colors duration-300"
                  >
                    ИЗХОД
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-300"
                  >
                    ВХОД
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-gray-700 text-white hover:bg-gray-600 transition-colors duration-300"
                  >
                    РЕГИСТРАЦИЯ
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;