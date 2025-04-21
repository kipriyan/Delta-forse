import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/config';

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

  // Функция за зареждане на оборудване - коригирана за правилна структура на данни
  const fetchEquipment = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Зареждане на оборудване за страница:', page);
      
      // Директна заявка без филтри първоначално, за да тестваме
      const response = await fetch(`${API_URL}/equipment?page=${page}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Грешка при зареждане на оборудване: ${response.status}`);
      }

      const data = await response.json();
      console.log('Получени данни:', data);
      
      if (data.success) {
        // Коригирана проверка за структурата на данните - вече очакваме data.data да бъде масив
        if (data.data && Array.isArray(data.data)) {
          console.log('Брой на получените оборудвания:', data.data.length);
          if (data.data.length > 0) {
            console.log('Първо оборудване:', data.data[0]);
          }
          
          setEquipmentList(data.data);
          setPagination(data.pagination || {
            page: 1,
            limit: 10,
            total: data.data.length,
            pages: 1
          });
        } else {
          console.error('Невалидна структура на данните:', data);
          setEquipmentList([]);
          setError('Грешка в структурата на данните');
        }
      } else {
        setError(data.error || 'Възникна грешка при зареждане на оборудване');
      }
    } catch (err) {
      console.error('Грешка при зареждане на оборудване:', err);
      setError('Възникна грешка при зареждане на оборудване. Моля, опитайте отново.');
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

  // Функция за изпращане на заявка за наемане
  const sendRentalRequest = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Трябва да сте влезли в профила си, за да изпратите заявка за наемане');
      return;
    }
    
    if (!selectedEquipment) {
      setError('Не е избрано оборудване за наемане');
      return;
    }
    
    if (!rentalRequestData.startDate || !rentalRequestData.endDate) {
      setError('Моля, изберете начална и крайна дата');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const requestData = {
        equipment_id: selectedEquipment.id,
        start_date: rentalRequestData.startDate,
        end_date: rentalRequestData.endDate,
        message: rentalRequestData.message
      };
      
      const response = await fetch(`${API_URL}/rentals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Вашата заявка за наемане е изпратена успешно!');
        setShowRentRequestForm(false);
        setRentalRequestData({
          startDate: '',
          endDate: '',
          message: ''
        });
      } else {
        setError(data.error || 'Възникна грешка при изпращане на заявката');
      }
    } catch (err) {
      console.error('Грешка при изпращане на заявката:', err);
      setError('Възникна грешка при изпращане на заявката. Моля, опитайте отново.');
    } finally {
      setLoading(false);
    }
  };

  // Рендериране на списъка с оборудване
  const renderEquipmentList = () => {
    console.log('Рендериране на списъка с оборудване:', { loading, error, listLength: equipmentList.length });
    
    if (loading) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-white">Зареждане...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900 text-white p-4 rounded-md mb-6">
          <p>Грешка: {error}</p>
        </div>
      );
    }

    if (!equipmentList || equipmentList.length === 0) {
      return (
        <div className="bg-gray-800 p-6 rounded-md text-center my-6">
          <p className="text-gray-300">Не е намерено оборудване, отговарящо на критериите.</p>
        </div>
      );
    }

    // Показваме цялата информация за оборудването
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
        {equipmentList.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            {/* Заглавна снимка */}
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
            
            {/* Основна информация */}
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
                <span>{item.location}</span>
              </div>
              
              <div className="flex items-center text-gray-400 mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                </svg>
                <span className="capitalize">{item.category === 'tools' ? 'Инструменти' : 
                  item.category === 'construction' ? 'Строителни материали' : 
                  item.category === 'machinery' ? 'Машини' : 'Други'}</span>
              </div>
              
              <div className="flex items-center text-gray-400 mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span>Собственик: {item.owner_name || 'Неизвестен'} (ID: {item.user_id})</span>
              </div>
              
              <button
                onClick={() => {
                  setSelectedEquipment(item);
                  setShowRentRequestForm(true);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                disabled={!user}
              >
                {user ? 'Наеми' : 'Влезте в профила си, за да наемете'}
              </button>
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

  // Модален прозорец за изпращане на заявка за наемане
  const renderRentRequestModal = () => {
    if (!showRentRequestForm || !selectedEquipment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-semibold mb-4 text-white">
            Заявка за наемане на "{selectedEquipment.title}"
          </h3>
          
          <form onSubmit={sendRentalRequest}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Начална дата
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={rentalRequestData.startDate}
                onChange={(e) => setRentalRequestData({...rentalRequestData, startDate: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Крайна дата
              </label>
              <input
                type="date"
                required
                min={rentalRequestData.startDate || new Date().toISOString().split('T')[0]}
                value={rentalRequestData.endDate}
                onChange={(e) => setRentalRequestData({...rentalRequestData, endDate: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Съобщение (по желание)
              </label>
              <textarea
                value={rentalRequestData.message}
                onChange={(e) => setRentalRequestData({...rentalRequestData, message: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 min-h-[100px]"
                placeholder="Въведете съобщение до наемодателя..."
              ></textarea>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300">
                Обща цена за периода: <span className="font-bold text-green-400">
                  {selectedEquipment.price * 
                    (rentalRequestData.startDate && rentalRequestData.endDate ? 
                      Math.max(1, Math.floor((new Date(rentalRequestData.endDate) - new Date(rentalRequestData.startDate)) / (1000 * 60 * 60 * 24))) : 
                      0)} лв
                </span>
              </p>
            </div>
            
            {error && (
              <div className="mb-4 text-red-500 text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowRentRequestForm(false);
                  setRentalRequestData({
                    startDate: '',
                    endDate: '',
                    message: ''
                  });
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Отказ
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Изпращане...' : 'Изпрати заявка'}
              </button>
            </div>
          </form>
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

  // Променяме MyListingsModal да приема handleEdit като prop
  const MyListingsModal = ({ onClose, onEdit }) => {
    const myListings = equipmentList.filter(item => item.owner === "Иван Иванов");

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Моите обяви</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {myListings.map(equipment => (
                <div key={equipment.id} className="bg-gray-700 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{equipment.title}</h3>
                      <p className="text-gray-400 mt-1">{equipment.price}</p>
                      <p className="text-gray-400">{equipment.location}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => onEdit(equipment)}
                        className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
                        title="Редактирай обявата"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Сигурни ли сте, че искате да изтриете тази обява?')) {
                            // Тук ще добавим API заявка за изтриване
                            console.log('Deleting equipment:', equipment.id);
                          }
                        }}
                        className="px-4 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                        title="Изтрий обявата"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 text-gray-300">{equipment.description}</p>

                  {equipment.images && equipment.images.length > 0 && (
                    <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                      {equipment.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${equipment.title} - изображение ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      Заявки: {rentalRequests.filter(r => r.equipmentId === equipment.id).length}
                    </div>
                    <button
                      onClick={() => {
                        const equipmentWithRequests = {
                          ...equipment,
                          requests: rentalRequests.filter(r => r.equipmentId === equipment.id)
                        };
                        setSelectedEquipment(equipmentWithRequests);
                        setShowViewRequests(true);
                      }}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Виж заявките →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Компонент за модалния прозорец с моите заявки
  const MyRequestsModal = ({ onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Моите заявки</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {equipmentList.map(equipment => (
                <div key={equipment.id} className="bg-gray-700 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{equipment.title}</h3>
                      <p className="text-gray-300 mt-1">Собственик: {equipment.owner}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium 
                      ${equipment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 
                        equipment.status === 'approved' ? 'bg-green-500/20 text-green-300' : 
                        'bg-gray-600 text-gray-300'}`}
                    >
                      {equipment.status === 'pending' ? 'В изчакване' : 
                       equipment.status === 'approved' ? 'Одобрена' : 'Отказана'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-300">
                    <div>
                      <span className="text-gray-400">От: </span>
                      {equipment.startDate}
                    </div>
                    <div>
                      <span className="text-gray-400">До: </span>
                      {equipment.endDate}
                    </div>
                    <div>
                      <span className="text-gray-400">Обща цена: </span>
                      {equipment.totalPrice}
                    </div>
                  </div>

                  <div className="mt-4 bg-gray-600/50 p-4 rounded-lg">
                    <p className="text-gray-300 text-sm">{equipment.message}</p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        if (window.confirm('Сигурни ли сте, че искате да изтриете тази заявка?')) {
                          setEquipmentList(prev => prev.filter(r => r.id !== equipment.id));
                        }
                      }}
                      className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      Изтрий заявката
                    </button>
                    <button
                      onClick={() => {
                        const equipment = findEquipmentByRequest(equipment);
                        setSelectedEquipment(equipment);
                        setEditingRequest({
                          startDate: equipment.startDate,
                          endDate: equipment.endDate,
                          message: equipment.message
                        });
                        setShowPublishModal(false);
                        onClose();
                      }}
                      className="px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Редактирай заявката
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          alert(isEditing ? 'Оборудването е обновено успешно!' : 'Оборудването е публикувано успешно!');
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
            onClick={() => setShowMyListings(true)}
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
                    onClick={() => setSelectedEquipment(equipment)}
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
          onEdit={handleEditEquipment}
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

      {showRentRequestForm && (
        renderRentRequestModal()
      )}
    </div>
  );
};

export default EquipmentPage; 