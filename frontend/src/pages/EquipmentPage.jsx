import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/config';
import { Link } from 'react-router-dom';

const EquipmentPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('rent');
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMyListings, setShowMyListings] = useState(false);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [showViewRequests, setShowViewRequests] = useState(false);
  const [equipmentData, setEquipmentData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    category: 'tools',
    images: []
  });
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(['tools', 'construction', 'machinery', 'other']);
  const [equipmentList, setEquipmentList] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    location: ''
  });
  const [showRentRequestForm, setShowRentRequestForm] = useState(false);
  const [rentalRequestData, setRentalRequestData] = useState({
    startDate: '',
    endDate: '',
    message: ''
  });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [myEquipment, setMyEquipment] = useState([]);
  const [isLoadingMyEquipment, setIsLoadingMyEquipment] = useState(false);
  const [myEquipmentError, setMyEquipmentError] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);
  const [editFormData, setEditFormData] = useState({
    startDate: '',
    endDate: '',
    message: ''
  });
  const [editingApplicationId, setEditingApplicationId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    message: '',
    type: 'success' // success, error, warning, info
  });
  // Добавяме състояние за модалния прозорец за потвърждение
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null,
    actionType: 'delete' // delete, cancel, etc.
  });

  // Логваме информация за потребителя от AuthContext
  useEffect(() => {
    console.log('Потребителски данни от AuthContext:', user);
  }, [user]);

  // Зареждане на категориите при монтиране на компонента
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/equipment/categories`);
        console.log('Получени категории:', res.data);
        
        if (res.data.success && Array.isArray(res.data.data)) {
          // Проверка на данните и задаване на стандартни категории при проблем
          const validCategories = res.data.data.filter(cat => typeof cat === 'string' && cat);
          setCategories(validCategories.length > 0 ? validCategories : ['tools', 'construction', 'machinery', 'other']);
        }
      } catch (err) {
        console.error('Грешка при зареждане на категориите:', err);
        // Използване на стандартни категории при грешка
        setCategories(['tools', 'construction', 'machinery', 'other']);
      }
    };

    fetchCategories();
  }, []);

  // Преглед на целия API отговор
  useEffect(() => {
    // Тест на API свързаността
    const testApiConnection = async () => {
      try {
        const res = await axios.get(`${API_URL}/equipment`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('API свързаност тест успешен:', res.status);
      } catch (err) {
        console.error('API свързаност тест неуспешен:', err);
      }
    };
    
    testApiConnection();
  }, []);

  // Функция за зареждане на оборудване с контакти
  const fetchEquipment = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/equipment?page=${page}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Грешка при зареждане на оборудване: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        console.log('Получени данни за оборудване:', data.data);
        setEquipmentList(data.data);
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: data.data.length,
          pages: 1
        });
      } else {
        setError('Невалидни данни получени от сървъра');
        setEquipmentList([]);
      }
    } catch (err) {
      console.error('Грешка при зареждане на оборудване:', err);
      setError('Възникна грешка при зареждане на оборудване');
    } finally {
      setLoading(false);
    }
  };

  // Зареждане на оборудване при първоначално зареждане
  useEffect(() => {
    console.log('Компонентът е зареден, изпълняваме fetchEquipment()');
    fetchEquipment();
  }, []);

  // Зареждане на оборудване при промяна на филтрите
  useEffect(() => {
    // Добавяме дебаунс за филтрите
    const debounceFilter = setTimeout(() => {
      fetchEquipment(1);
    }, 500);

    return () => clearTimeout(debounceFilter);
  }, [filters]);

  // Функция за изпращане на заявка за наем
  const handleRentalRequest = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    try {
      // Проверка за валиден токен
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Трябва да влезете в профила си, за да направите заявка', 'warning');
        return;
      }
      
      // Подготвяме данните с правилните имена на полетата
      const requestData = {
        equipment_id: selectedEquipment.id,
        start_date: rentalRequestData.startDate,  // Съобразено с очакванията на API
        end_date: rentalRequestData.endDate,      // Съобразено с очакванията на API
        message: rentalRequestData.message
      };
      
      console.log('Изпращане на заявка с данни:', requestData);
      
      const response = await axios.post(
        `${API_URL}/equipment-rentals`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        showAlert('Заявката за наем е изпратена успешно!', 'success');
        setShowInfoModal(false);
        setSelectedEquipment(null);
        setRentalRequestData({
          startDate: '',
          endDate: '',
          message: ''
        });
      } else {
        showAlert(`Грешка: ${response.data.error}`, 'error');
      }
    } catch (error) {
      console.error('Грешка при изпращане на заявка:', error);
      console.error('Детайли за грешката:', error.response?.data);
      showAlert(`Грешка при изпращане на заявката: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Подобрен рендер на списъка с оборудване
  const renderEquipmentList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900 text-white p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      );
    }

    if (!equipmentList || equipmentList.length === 0) {
      return (
        <div className="bg-gray-800 p-6 rounded-md text-center">
          <p className="text-gray-300">Не е намерено оборудване, отговарящо на критериите.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {equipmentList.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="h-48 bg-gray-700 flex items-center justify-center">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p>Няма снимка</p>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <span className="text-lg font-bold text-green-400">{item.price} лв/ден</span>
              </div>
              
              <p className="text-gray-400 mb-4 line-clamp-3">{item.description}</p>
              
              <div className="flex items-center text-gray-400 mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span>{item.location || 'Неизвестно местоположение'}</span>
              </div>
              
              <div className="flex items-center text-gray-400 mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                </svg>
                <span className="capitalize">{item.category === 'tools' ? 'Инструменти' : 
                  item.category === 'construction' ? 'Строителни материали' : 
                  item.category === 'machinery' ? 'Машини' : 
                  item.category === 'electronics' ? 'Електроника' : 'Други'}</span>
              </div>
              
              <div className="flex items-center text-gray-400 mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span>Собственик: {item.owner_name}</span>
              </div>
              
              <div className="flex items-center text-gray-400 mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span>Контакт: {item.owner_email}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedEquipment(item);
                    setShowInfoModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                  disabled={!user}
                >
                  {user ? 'Наеми' : 'Трябва да сте влезли'}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedEquipment(item);
                    setShowInfoModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Повече информация
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Рендериране на формата за филтриране
  const renderFilterForm = () => {
    return (
      <div className="bg-gray-800 p-4 mb-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Търсене
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
              placeholder="Търсете по заглавие..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Категория
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
            >
              <option value="">Всички категории</option>
              <option value="tools">Инструменти</option>
              <option value="construction">Строителни материали</option>
              <option value="machinery">Машини</option>
              <option value="other">Други</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Цена от
            </label>
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
              placeholder="Мин. цена"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Цена до
            </label>
            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
              placeholder="Макс. цена"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Локация
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
              placeholder="Въведете град..."
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({
              search: '',
              category: '',
              minPrice: '',
              maxPrice: '',
              location: ''
            })}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Изчисти филтрите
          </button>
        </div>
      </div>
    );
  };

  // Рендериране на пагинацията
  const renderPagination = () => {
    if (!pagination || pagination.pages <= 1) return null;

    // Създаваме масив с номерата на страниците
    const pageNumbers = [];
    for (let i = 1; i <= pagination.pages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center mt-6">
        <nav className="flex items-center">
          <button
            onClick={() => fetchEquipment(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 bg-gray-700 text-white rounded-l-md hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            &lt;
          </button>
          {pageNumbers.map(page => (
            <button
              key={page}
              onClick={() => fetchEquipment(page)}
              className={`px-3 py-1 ${pagination.page === page ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-gray-600 transition-colors`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => fetchEquipment(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-3 py-1 bg-gray-700 text-white rounded-r-md hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            &gt;
          </button>
        </nav>
      </div>
    );
  };

  // Добавяме функция за изчисляване на цената
  const calculatePrice = () => {
    if (!selectedEquipment || !rentalRequestData.startDate || !rentalRequestData.endDate) {
      return 0;
    }
    
    const start = new Date(rentalRequestData.startDate);
    const end = new Date(rentalRequestData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    return diffDays * selectedEquipment.price;
  };

  // Добавяме функция за обработка на изпращането на заявка
  const handleRentRequest = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    try {
      // Проверка за валиден токен
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Трябва да влезете в профила си, за да направите заявка', 'warning');
        return;
      }
      
      const requestData = {
        equipment_id: selectedEquipment.id,
        start_date: rentalRequestData.startDate,
        end_date: rentalRequestData.endDate,
        message: rentalRequestData.message
      };
      
      // Използваме /equipment-rentals вместо /applications
      const response = await axios.post(
        `${API_URL}/equipment-rentals`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        showAlert('Заявката за наем е изпратена успешно!', 'success');
        setShowInfoModal(false);
        setSelectedEquipment(null);
        setRentalRequestData({
          startDate: '',
          endDate: '',
          message: ''
        });
      } else {
        showAlert(`Грешка: ${response.data.error}`, 'error');
      }
    } catch (error) {
      console.error('Грешка при изпращане на заявка:', error);
      showAlert(`Грешка при изпращане на заявката: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Добавяме компонент за модалния прозорец
  const renderInfoModal = () => {
    if (!selectedEquipment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">
                {selectedEquipment.title}
              </h2>
              <button onClick={() => setShowInfoModal(false)} className="text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-300 mb-2">Описание</p>
                <p className="text-white">{selectedEquipment.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300 mb-1">Цена на ден</p>
                  <p className="text-xl font-bold text-white">{selectedEquipment.price} лв.</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300 mb-1">Локация</p>
                  <p className="text-white">{selectedEquipment.location}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300 mb-1">Собственик</p>
                  <p className="text-white">{selectedEquipment.owner}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300 mb-1">Контакт</p>
                  <p className="text-white">{selectedEquipment.contact}</p>
                </div>
              </div>
            </div>
            
            {user ? (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Наемане на оборудване</h3>
                <form onSubmit={handleRentRequest} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Начална дата
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={rentalRequestData.startDate}
                        onChange={(e) => setRentalRequestData({...rentalRequestData, startDate: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Крайна дата
                      </label>
                      <input
                        type="date"
                        min={rentalRequestData.startDate || new Date().toISOString().split('T')[0]}
                        value={rentalRequestData.endDate}
                        onChange={(e) => setRentalRequestData({...rentalRequestData, endDate: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Съобщение
                    </label>
                    <textarea
                      value={rentalRequestData.message}
                      onChange={(e) => setRentalRequestData({...rentalRequestData, message: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                      placeholder="Допълнителна информация относно наемането..."
                    ></textarea>
                  </div>
                  
                  {rentalRequestData.startDate && rentalRequestData.endDate && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">Брой дни:</span>
                        <span className="text-white">
                          {Math.max(1, Math.ceil((new Date(rentalRequestData.endDate) - new Date(rentalRequestData.startDate)) / (1000 * 60 * 60 * 24)))}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-300">Обща цена:</span>
                        <span className="text-white">
                          {calculatePrice()} лв.
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-4 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowInfoModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      Отказ
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Изпрати заявка
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-300 mb-4">За да наемете това оборудване, трябва да влезете в профила си.</p>
                <Link to="/login" className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">
                  Вход в системата
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Добавяме функция за редактиране, която ще подадем на MyListingsModal
  const handleEditEquipment = (equipment) => {
    const editData = {
      id: equipment.id,
      title: equipment.title,
      description: equipment.description,
      price: equipment.price,
      location: equipment.location,
      category: equipment.category || 'tools',
      images: equipment.images || [],
      owner: equipment.owner,
      contact: equipment.contact,
      specifications: equipment.specifications
    };
    setEditingEquipment(editData);
    setShowPublishModal(true);
    setShowMyListings(false); // Затваряме списъка с обяви
  };

  // Функция за зареждане на моите обяви за оборудване
  const fetchMyEquipment = async () => {
    try {
      setIsLoadingMyEquipment(true);
      setMyEquipmentError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Необходима е автентикация');
      }
      
      // Променяме URL-а, за да извлечем само обявите на текущия потребител
      const response = await axios.get(`${API_URL}/equipment/my`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log('Извлечени мои обяви:', response.data.data);
        setMyEquipment(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Грешка при зареждане на моите обяви');
      }
    } catch (error) {
      console.error('Грешка при зареждане на моите обяви:', error);
      setMyEquipmentError(error.message || 'Възникна грешка при зареждане');
    } finally {
      setIsLoadingMyEquipment(false);
    }
  };

  // Функция за показване на модалния прозорец за моите обяви
  const handleViewMyListings = () => {
    setShowMyListings(true);
    fetchMyEquipment(); // Зареждаме моите обяви при отваряне на модала
  };

  // Актуализираме функцията за обработка на заявките
  const handleRentalApplication = async (equipmentId, applicationId, action) => {
    if (!user) {
      console.error('Потребителят не е влязъл в профила си');
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/applications/${applicationId}/${action}`, {}, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      console.log(`Заявка ${action} отговор:`, response.data);
      
      // Актуализираме списъка със собствени обяви
      fetchMyEquipment();
      
      // Показваме съобщение за успех
      showAlert(action === 'approve' ? 
        'Заявката за наем беше одобрена успешно!' : 
        'Заявката за наем беше отхвърлена успешно!', 'success');
        
    } catch (err) {
      console.error(`Грешка при ${action} на заявка:`, err);
      showAlert(`Възникна грешка: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  // Уверяваме се, че useEffect се изпълнява когато потребителят отвори модала
  useEffect(() => {
    if (showMyListings && user) {
      console.log('Отваряне на модал за собствени обяви, зареждане на данни...');
      fetchMyEquipment();
    }
  }, [showMyListings, user]);

  // Обновяваме компонент за модалния прозорец за показване на собствените обяви
  const MyListingsModal = ({ onClose, myEquipment, isLoading, error, onRetry, onApprove, onReject }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col"> {/* Определяме максимална височина */}
          <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center z-10">
            <h2 className="text-xl font-semibold text-white">Моите обяви</h2>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1"> {/* Добавяме overflow-y-auto и flex-1 */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="mt-3 text-gray-300">Зареждане на обявите...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <button 
                  onClick={onRetry} 
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Опитай отново
                </button>
              </div>
            ) : myEquipment.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-300 mb-3">Нямате публикувани обяви все още.</p>
                <button 
                  onClick={() => {
                    onClose();
                    // Тук може да отворите формата за публикуване на обява
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                >
                  Публикувай обява
                </button>
              </div>
            ) : (
              <div className="space-y-8 pb-4"> {/* Добавяме padding отдолу за по-добър скролинг */}
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-300">Общо обяви: <span className="font-semibold text-white">{myEquipment.length}</span></p>
                  <button 
                    onClick={() => {
                      onClose();
                      setShowPublishModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-500 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Нова обява
                  </button>
                </div>
                
                {myEquipment.map(equipment => (
                  <div key={equipment.id} className="bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-white">{equipment.title}</h3>
                          <div className="flex items-center mt-1 text-gray-300">
                            <span className="mr-3">{equipment.price} лв. / ден</span>
                            <span>{equipment.location}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingEquipment(equipment);
                              setShowPublishModal(true);
                              onClose();
                            }}
                            className="p-2 bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition-colors"
                            title="Редактирай обявата"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              // Вместо директно изтриване, първо показваме потвърждение
                              showConfirm(
                                'Сигурни ли сте, че искате да изтриете тази обява?', 
                                async () => {
                                  // Код за изтриване след потвърждение
                                  try {
                                    // Проверка за токен
                                    if (!token) {
                                      console.error('Не е намерен валиден токен за аутентикация');
                                      showAlert('За да изтриете обява, трябва да влезете в профила си. Моля, презаредете страницата или влезте отново.', 'warning');
                                      return;
                                    }

                                    const response = await axios.delete(`${API_URL}/api/equipment/${equipment.id}`, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    
                                    if (response.data.success) {
                                      // Актуализираме списъка с оборудване
                                      setMyEquipment(prev => prev.filter(equip => equip.id !== equipment.id));
                                      showAlert('Обявата беше изтрита успешно!', 'success');
                                    }
                                  } catch (error) {
                                    console.error('Грешка при изтриване на оборудване:', error);
                                    
                                    let errorMessage = 'Възникна грешка при изтриване на обявата.';
                                    
                                    if (error.response) {
                                      if (error.response.status === 401) {
                                        errorMessage = 'Вашата сесия е изтекла. Моля, влезте отново в профила си, за да изтриете обявата.';
                                      } else if (error.response.data && error.response.data.error) {
                                        errorMessage = error.response.data.error;
                                      }
                                    }
                                    
                                    showAlert(errorMessage, 'error');
                                  }
                                },
                                'delete'
                              );
                            }}
                            className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                            title="Изтрий обявата"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <p className="mt-4 text-gray-300">{equipment.description}</p>

                      <div className="mt-6 border-t border-gray-600 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">
                          Заявки за наемане ({equipment.applications?.length || 0})
                        </h4>
                        
                        {!equipment.applications || equipment.applications.length === 0 ? (
                          <p className="text-gray-400">Все още няма заявки за тази обява.</p>
                        ) : (
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2"> {/* Добавяме скролбар и за заявките */}
                            {equipment.applications.map(application => (
                              <div key={application.id} className="bg-gray-800 p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-white font-medium">{application.renterName || 'Неизвестен'}</p>
                                    <p className="text-gray-400 text-sm">{application.renterPhone || 'Няма телефон'}</p>
                                    <p className="text-gray-400 text-sm mt-1">
                                      Период: {application.startDate || 'N/A'} - {application.endDate || 'N/A'}
                                    </p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium 
                                    ${application.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 
                                      application.status === 'approved' ? 'bg-green-500/20 text-green-300' : 
                                      'bg-red-500/20 text-red-300'}`}
                                  >
                                    {application.status === 'pending' ? 'В изчакване' : 
                                     application.status === 'approved' ? 'Одобрена' : 'Отказана'}
                                  </span>
                                </div>
                                
                                <div className="mt-2 bg-gray-700/50 p-3 rounded">
                                  <p className="text-gray-300 text-sm">{application.message || 'Няма съобщение'}</p>
                                </div>
                                
                                {application.status === 'pending' && (
                                  <div className="mt-3 flex justify-end space-x-3">
                                    <button
                                      onClick={() => onReject(equipment.id, application.id)}
                                      className="px-4 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors text-sm"
                                    >
                                      Откажи
                                    </button>
                                    <button
                                      onClick={() => onApprove(equipment.id, application.id)}
                                      className="px-4 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors text-sm"
                                    >
                                      Одобри
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Компонент MyRequestsModal за показване на моите заявки
  const MyRequestsModal = ({ onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [localApplications, setLocalApplications] = useState([]);
    const requestRunning = useRef(false);
    const requestId = useRef(`req-${Date.now()}`);
    
    const loadApplications = useCallback(async () => {
      // Предотвратяваме паралелни заявки
      if (requestRunning.current) {
        console.log('Заявка вече се изпълнява, пропускаме...');
        return;
      }
      
      try {
        requestRunning.current = true;
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Необходима е автентикация');
        }
        
        console.log('Изпращане на заявка към API...');
        
        const response = await axios.get(`${API_URL}/equipment-rentals/my`, {
          headers: {
            'Authorization': `Bearer ${token}`
            // Без X-Request-ID заглавие, докато не го добавим към разрешените в CORS
          }
        });
        
        console.log(`Получен отговор за заявка [${requestId.current}]:`, response.data);
        
        if (response.data.success) {
          setLocalApplications(response.data.data || []);
        } else {
          throw new Error(response.data.error || 'Грешка при зареждане на заявките');
        }
      } catch (error) {
        console.error('Грешка при зареждане на заявките:', error);
        setError(error.message || 'Възникна грешка при зареждане');
      } finally {
        setIsLoading(false);
        requestRunning.current = false;
      }
    }, []);
    
    // Зареждаме данните при първоначално отваряне
    useEffect(() => {
      // Извикваме loadApplications само веднъж при първоначално зареждане
      if (!requestRunning.current) {
        loadApplications();
      }
      
      // Изчистване при размонтиране
      return () => {
        requestRunning.current = false;
      };
    }, [loadApplications]);

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-gray-800 rounded-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-6 flex justify-between">
            <span>Моите заявки за наем</span>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              &times;
            </button>
          </h2>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-white text-center">Зареждане на вашите заявки...</p>
            </div>
          ) : error ? (
            <div className="bg-red-800/50 text-white p-6 rounded-lg text-center">
              <p className="text-lg mb-4">{error}</p>
              <button 
                onClick={() => !requestRunning.current && loadApplications()} 
                className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                disabled={requestRunning.current}
              >
                {requestRunning.current ? 'Зареждане...' : 'Опитай отново'}
              </button>
            </div>
          ) : localApplications && localApplications.length > 0 ? (
            <div className="space-y-6">
              {localApplications.map(application => (
                <div key={application.id} className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-xl text-white font-semibold mb-2">
                    {application.equipment_title || 'Заявка за оборудване'}
                  </h3>
                  <div className="mt-2 text-gray-300 space-y-1">
                    <p>Начална дата: {new Date(application.start_date).toLocaleDateString('bg')}</p>
                    <p>Крайна дата: {new Date(application.end_date).toLocaleDateString('bg')}</p>
                    <p>Статус: {
                      application.status === 'pending' ? 'В изчакване' :
                      application.status === 'approved' ? 'Одобрена' :
                      application.status === 'rejected' ? 'Отказана' : 
                      application.status || 'Неизвестен'
                    }</p>
                    {application.message && (
                      <p className="mt-2 bg-gray-800 p-2 rounded">
                        <span className="text-gray-400">Съобщение:</span> {application.message}
                      </p>
                    )}
                  </div>
                  
                  {application.status === 'pending' && (
                    <div className="mt-4 flex space-x-2 justify-end">
                      <button 
                        onClick={() => openEditForm(application)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Редактирай
                      </button>
                      <button 
                        onClick={() => cancelRentalRequest(application.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Откажи
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-300 mb-4">Нямате активни заявки за наем.</p>
              <button 
                onClick={() => !requestRunning.current && loadApplications()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={requestRunning.current}
              >
                {requestRunning.current ? 'Зареждане...' : 'Презареди'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Добавяме нов компонент за преглед на заявките към обява
  const ViewRequestsModal = ({ equipment, onClose }) => {
    const requests = rentalRequests.filter(r => r.equipmentId === equipment.id);

    const handleRequestAction = (requestId, action) => {
      if (action === 'accept') {
        if (window.confirm('Сигурни ли сте, че искате да одобрите тази заявка?')) {
          // Тук ще добавим API заявка за одобрение
          console.log('Accepting request:', requestId);
        }
      } else if (action === 'reject') {
        if (window.confirm('Сигурни ли сте, че искате да откажете тази заявка?')) {
          // Тук ще добавим API заявка за отказ
          console.log('Rejecting request:', requestId);
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Заявки за наемане</h2>
                <p className="text-gray-400 mt-1">{equipment.title}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {requests.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Все още няма заявки за тази обява</p>
            ) : (
              <div className="space-y-4">
                {requests.map(request => (
                  <div key={request.id} className="bg-gray-700 p-6 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {request.renterName}
                        </h3>
                        <div className="space-y-2 text-gray-300">
                          <p>Телефон: {request.renterPhone}</p>
                          <p>Период: {request.startDate} - {request.endDate}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium 
                        ${request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 
                          request.status === 'approved' ? 'bg-green-500/20 text-green-300' : 
                          'bg-red-500/20 text-red-300'}`}
                      >
                        {request.status === 'pending' ? 'В изчакване' : 
                         request.status === 'approved' ? 'Одобрена' : 'Отказана'}
                      </span>
                    </div>

                    <div className="mt-4 bg-gray-600/50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        Съобщение от наемателя:
                      </h4>
                      <p className="text-gray-300">{request.message}</p>
                    </div>

                    {request.status === 'pending' && (
                      <div className="mt-4 flex justify-end space-x-4">
                        <button
                          onClick={() => handleRequestAction(request.id, 'reject')}
                          className="px-4 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                        >
                          Откажи
                        </button>
                        <button
                          onClick={() => handleRequestAction(request.id, 'accept')}
                          className="px-4 py-2 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors"
                        >
                          Одобри
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Добавяме компонент за публикуване/редактиране на обява
  const PublishEquipmentModal = ({ equipment, isEditing, onClose }) => {
    const [formData, setFormData] = useState({
      title: equipment?.title || '',
      description: equipment?.description || '',
      price: equipment?.price || '',
      location: equipment?.location || ''
      // Премахнато е category и images, фокусираме се върху задължителните полета
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setFormLoading(true);
      setFormError(null);

      try {
        // Валидация на задължителните полета
        if (!formData.title.trim() || !formData.description.trim() || 
            !formData.price || !formData.location.trim()) {
          setFormError('Моля, попълнете всички задължителни полета');
          setFormLoading(false);
          return;
        }

        const payload = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          location: formData.location.trim()
        };

        console.log('Изпращане на данни от модала:', JSON.stringify(payload));

        const token = localStorage.getItem('token');
        if (!token) {
          setFormError('Необходимо е да сте влезли в профила си');
          setFormLoading(false);
          return;
        }

        const url = isEditing 
          ? `${API_URL}/equipment/${equipment.id}`
          : `${API_URL}/equipment`;
        
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (data.success) {
          showAlert(isEditing ? 'Оборудването е обновено успешно!' : 'Оборудването е публикувано успешно!', 'success');
          onClose();
        } else {
          setFormError(data.error || 'Възникна грешка при публикуването');
        }
      } catch (err) {
        console.error('Грешка при публикуване:', err);
        setFormError('Грешка при изпращане на заявката: ' + err.message);
      } finally {
        setFormLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">
                {isEditing ? 'Редактирай оборудване' : 'Публикувай ново оборудване'}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/30 text-red-200 rounded-md">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Заглавие
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Цена на ден (лв.)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Локация
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Отказ
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {formLoading 
                    ? 'Публикуване...' 
                    : (isEditing ? 'Запази промените' : 'Публикувай')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Функция за показване на диалог за потвърждение
  const showConfirm = (message, onConfirm, actionType = 'delete') => {
    setConfirmModal({
      isOpen: true,
      message,
      onConfirm,
      actionType
    });
  };

  // В метода за отказване на заявка за наем
  const cancelRentalRequest = async (requestId) => {
    showConfirm(
      'Сигурни ли сте, че искате да отмените тази заявка?', 
      async () => {
        try {
          const response = await axios.put(
            `${API_URL}/api/equipment/requests/${requestId}/cancel`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          if (response.data.success) {
            // Актуализираме списъка със заявки
            setMyApplications(prev => 
              prev.map(app => 
                app.id === requestId 
                  ? { ...app, status: 'cancelled' } 
                  : app
              )
            );
            
            showAlert('Заявката беше успешно отказана!', 'success');
          }
        } catch (error) {
          console.error('Грешка при отказване на заявка:', error);
          showAlert(`Грешка при отказване на заявката: ${error.response?.data?.error || error.message}`, 'error');
        }
      },
      'cancel'
    );
  };

  // Компонент за модалния прозорец за потвърждение
  const ConfirmModal = () => {
    if (!confirmModal.isOpen) return null;
    
    // Определяме текста и стила според типа действие
    const getActionDetails = () => {
      switch(confirmModal.actionType) {
        case 'delete':
          return {
            title: 'Потвърждение за изтриване',
            buttonText: 'Изтрий',
            buttonClass: 'bg-red-600 hover:bg-red-700'
          };
        case 'cancel':
          return {
            title: 'Потвърждение за отказ',
            buttonText: 'Откажи заявката',
            buttonClass: 'bg-yellow-600 hover:bg-yellow-700'
          };
        default:
          return {
            title: 'Потвърждение',
            buttonText: 'Потвърди',
            buttonClass: 'bg-blue-600 hover:bg-blue-700'
          };
      }
    };
    
    const actionDetails = getActionDetails();
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}></div>
        <div className="relative bg-gray-800 border border-gray-700 px-6 py-4 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-white text-lg font-medium mb-4">{actionDetails.title}</div>
          <div className="mt-2 text-gray-300">{confirmModal.message}</div>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Отмени
            </button>
            <button
              onClick={() => {
                if (confirmModal.onConfirm) {
                  confirmModal.onConfirm();
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
              }}
              className={`px-4 py-2 ${actionDetails.buttonClass} text-white rounded transition-colors`}
            >
              {actionDetails.buttonText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Функция за намиране на оборудване по заявка
  const findEquipmentByRequest = (request) => {
    // Връща ID-то на оборудването от заявката, ако съществува
    return request.equipmentId || 
           (request.equipment && request.equipment.id) || 
           null;
  };

  // Напълно преработена функция за извличане на информация за оборудване
  const getEquipmentInfo = (application) => {
    // Валидация на входните данни с подробно логване
    console.log('Входна заявка:', application);
    
    if (!application) {
      console.warn('Липсва заявка');
      return null;
    }
    
    // Извличаме ID-то на оборудването от заявката
    let equipmentId = null;
    
    // Проверяваме различни места, където може да се съхранява ID-то
    if (application.equipmentId) {
      equipmentId = application.equipmentId;
    } else if (application.equipment && application.equipment.id) {
      equipmentId = application.equipment.id;
    }
    
    console.log('Намерено ID на оборудване:', equipmentId);
    return equipmentId;
  };

  // Функция за показване на съобщение
  const showAlert = (message, type = 'success') => {
    setAlertModal({
      isOpen: true,
      message,
      type
    });
    
    // Автоматично затваряне след 3 секунди за успешни съобщения
    if (type === 'success') {
      setTimeout(() => {
        setAlertModal(prev => ({ ...prev, isOpen: false }));
      }, 3000);
    }
  };

  // Компонент за модалния прозорец за известия
  const AlertModal = () => {
    if (!alertModal.isOpen) return null;
    
    // Определяме цветовете според типа на съобщението
    const getColors = () => {
      switch(alertModal.type) {
        case 'success':
          return 'bg-green-700/90 border-green-500';
        case 'error':
          return 'bg-red-700/90 border-red-500';
        case 'warning':
          return 'bg-yellow-700/90 border-yellow-500';
        case 'info':
          return 'bg-blue-700/90 border-blue-500';
        default:
          return 'bg-gray-700/90 border-gray-500';
      }
    };
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/50" onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}></div>
        <div className={`relative px-6 py-4 rounded-lg shadow-lg border-2 ${getColors()} max-w-md w-full mx-4`}>
          <div className="flex justify-between items-start">
            <div className="text-white text-lg font-medium">
              {alertModal.type === 'success' && 'Успех!'}
              {alertModal.type === 'error' && 'Грешка!'}
              {alertModal.type === 'warning' && 'Внимание!'}
              {alertModal.type === 'info' && 'Информация'}
            </div>
            <button 
              onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
              className="text-white hover:text-gray-300 transition-colors"
            >
              &times;
            </button>
          </div>
          <div className="mt-2 text-white">{alertModal.message}</div>
          {alertModal.type !== 'success' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Затвори
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex-grow">
        {/* Хедър секция */}
        <div className="relative max-w-7xl mx-auto px-4 h-[200px] flex items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">
              Оборудване
            </h1>
            <p className="text-xl text-gray-200">
              Намерете или предложете строително оборудване под наем
            </p>
          </div>
        </div>

        {/* Бутони за навигация */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('rent')}
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === 'rent' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Наеми
          </button>
          <button
            onClick={() => setShowPublishModal(true)}
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === 'offer' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Предложи
          </button>
          <button
            onClick={handleViewMyListings}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Виж моите обяви
          </button>
          <button
            onClick={() => setShowMyRequests(true)}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Моите заявки
          </button>
        </div>

        {/* Основно съдържание */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          {/* Премахваме дублираните бутони тук */}
          
          {/* Списък с оборудване */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipmentList.map(equipment => (
              <div key={equipment.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {/* Placeholder за снимка */}
                <div className="w-full h-48 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{equipment.title}</h3>
                  <p className="text-gray-300 mb-4">{equipment.description}</p>
                  <div className="space-y-2 text-gray-400">
                    <p>Цена: {equipment.price}</p>
                    <p>Локация: {equipment.location}</p>
                    <p>Собственик: {equipment.owner}</p>
                    <p>Контакт: {equipment.contact}</p>
                  </div>
                  <button 
                    onClick={() => {
                      console.log('Повече информация за:', equipment);
                      setSelectedEquipment(equipment);
                      setShowInfoModal(true);
                    }}
                    className="mt-4 w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Повече информация
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Модални прозорци */}
      {showMyListings && (
        <MyListingsModal 
          onClose={() => setShowMyListings(false)}
          myEquipment={myEquipment}
          isLoading={isLoadingMyEquipment}
          error={myEquipmentError}
          onRetry={fetchMyEquipment}
          onApprove={(equipmentId, applicationId) => 
            handleRentalApplication(equipmentId, applicationId, 'approve')
          }
          onReject={(equipmentId, applicationId) => 
            handleRentalApplication(equipmentId, applicationId, 'reject')
          }
        />
      )}

      {showMyRequests && (
        <MyRequestsModal onClose={() => setShowMyRequests(false)} />
      )}

      {showViewRequests && selectedEquipment && (
        <ViewRequestsModal
          equipment={selectedEquipment}
          onClose={() => {
            setShowViewRequests(false);
            setSelectedEquipment(null);
          }}
        />
      )}

      {showPublishModal && (
        <PublishEquipmentModal
          equipment={editingEquipment}
          isEditing={!!editingEquipment}
          onClose={() => {
            setShowPublishModal(false);
            setEditingEquipment(null);
          }}
        />
      )}

      {/* Добавяме модалния прозорец за редактиране на заявка */}
      {selectedEquipment && editingRequest && (
        <EquipmentModal
          equipment={selectedEquipment}
          onClose={() => {
            setSelectedEquipment(null);
            setEditingRequest(null);
          }}
          isEditing={true}
          initialData={editingRequest}
        />
      )}

      {showInfoModal && renderInfoModal()}

      {/* Добавяме модал за редактиране на заявка */}
      {editingApplicationId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Редактиране на заявка</h3>
              <button 
                onClick={closeEditForm} 
                className="p-1 hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={submitEditForm}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Начална дата
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={editFormData.startDate}
                  onChange={handleEditFormChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Крайна дата
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={editFormData.endDate}
                  onChange={handleEditFormChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Съобщение
                </label>
                <textarea
                  name="message"
                  value={editFormData.message}
                  onChange={handleEditFormChange}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeEditForm}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Отказ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                >
                  Запази промените
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AlertModal />
      {confirmModal.isOpen && <ConfirmModal />}
    </div>
  );
};

export default EquipmentPage; 
