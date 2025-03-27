import React, { useState } from 'react';

const EquipmentPage = () => {
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

  // Примерни данни за екипировка
  const equipmentList = [
    {
      id: 1,
      title: "Професионален перфоратор Bosch",
      description: "Мощен перфоратор, подходящ за строителни дейности",
      price: "50 лв. / ден",
      location: "София",
      owner: "Иван Иванов",
      category: "tools",
      contact: "0888 123 456",
      images: [
        "/images/equipment1-1.jpg",
        "/images/equipment1-2.jpg",
        "/images/equipment1-3.jpg"
      ],
      specifications: {
        brand: "Bosch",
        model: "GBH 2-26 DRE",
        power: "800W",
        weight: "2.7 кг"
      }
    },
    {
      id: 2,
      title: "Скеле 8м",
      description: "Алуминиево скеле, подходящо за външни ремонти",
      price: "100 лв. / ден",
      location: "Пловдив",
      owner: "Строителни услуги ООД",
      category: "construction",
      contact: "0888 456 789"
    }
  ];

  // Примерни данни за заявки за наемане
  const rentalRequests = [
    {
      id: 1,
      equipmentId: 1,
      renterName: "Петър Петров",
      renterPhone: "0888 111 222",
      startDate: "2024-03-20",
      endDate: "2024-03-25",
      status: "pending",
      message: "Бих искал да наема оборудването за строителен проект."
    },
    // Още заявки...
  ];

  // Примерни данни за заявки
  const [myRequests, setMyRequests] = useState([
    {
      id: 1,
      equipmentTitle: "Професионален перфоратор Bosch",
      owner: "Иван Иванов",
      startDate: "2024-03-20",
      endDate: "2024-03-25",
      status: "pending",
      message: "Бих искал да наема оборудването за строителен проект.",
      totalPrice: "250 лв."
    },
    // Още заявки...
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEquipmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    // Тук ще добавим логика за качване на изображения
    console.log('Uploaded files:', e.target.files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Equipment Data:', equipmentData);
    setShowPublishForm(false);
  };

  const handleRentalSubmit = (e) => {
    e.preventDefault();
    console.log('Rental request:', { equipment, ...rentalData });
    // Тук ще добавим логика за изпращане на заявката
  };

  // Намираме оригиналната екипировка по заявката
  const findEquipmentByRequest = (request) => {
    return equipmentList.find(eq => eq.title === request.equipmentTitle) || {
      id: request.id,
      title: request.equipmentTitle,
      description: "Информация за екипировката",
      price: request.totalPrice,
      location: "Локация",
      owner: request.owner,
      contact: "Контакт",
      images: ["/images/placeholder.jpg"],
      specifications: {
        "Статус на заявка": request.status === 'pending' ? 'В изчакване' : 
                           request.status === 'approved' ? 'Одобрена' : 'Отказана',
        "Период": `${request.startDate} - ${request.endDate}`,
        "Обща цена": request.totalPrice
      }
    };
  };

  const EquipmentModal = ({ equipment, onClose, isEditing, initialData }) => {
    const [rentalData, setRentalData] = useState(initialData || {
      startDate: '',
      endDate: '',
      message: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (isEditing) {
        // Логика за редактиране на съществуваща заявка
        console.log('Updating rental request:', rentalData);
      } else {
        // Логика за създаване на нова заявка
        console.log('Creating new rental request:', rentalData);
      }
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Галерия */}
            {equipment.images && equipment.images.length > 0 && (
              <div className="relative aspect-video bg-gray-900 rounded-lg mb-6">
                <img
                  src={equipment.images[currentImageIndex]}
                  alt={`${equipment.title} - изображение ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain rounded-lg"
                />
                
                {/* Бутони за навигация само ако има повече от 1 снимка */}
                {equipment.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? equipment.images.length - 1 : prev - 1
                      )}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === equipment.images.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                    >
                      →
                    </button>
                  </>
                )}
                
                {/* Индикатори */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                  {equipment.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentImageIndex === index ? 'bg-white' : 'bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Информация */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {equipment.title}
                  </h2>
                  <p className="text-gray-400">
                    {equipment.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-500">
                    {equipment.price}
                  </div>
                  <div className="text-gray-400">
                    {equipment.location}
                  </div>
                </div>
              </div>

              {/* Спецификации */}
              {equipment.specifications && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Детайли за заявката
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(equipment.specifications).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-400">{key}: </span>
                        <span className="text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Контакти */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Контакти
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400">Собственик: </span>
                    <span className="text-white">{equipment.owner}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Телефон: </span>
                    <span className="text-white">{equipment.contact}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Форма за наемане/редактиране */}
            <div className="mt-8 border-t border-gray-700 pt-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                {isEditing ? 'Редактирай заявка' : 'Заяви наемане'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Начална дата
                    </label>
                    <input
                      type="date"
                      value={rentalData.startDate}
                      onChange={(e) => setRentalData(prev => ({ ...prev, startDate: e.target.value }))}
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
                      value={rentalData.endDate}
                      onChange={(e) => setRentalData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Съобщение към собственика
                  </label>
                  <textarea
                    value={rentalData.message}
                    onChange={(e) => setRentalData(prev => ({ ...prev, message: e.target.value }))}
                    rows="4"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Отказ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    {isEditing ? 'Запази промените' : 'Изпрати заявка'}
                  </button>
                </div>
              </form>
            </div>
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
              {myRequests.map(request => (
                <div key={request.id} className="bg-gray-700 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{request.equipmentTitle}</h3>
                      <p className="text-gray-300 mt-1">Собственик: {request.owner}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium 
                      ${request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 
                        request.status === 'approved' ? 'bg-green-500/20 text-green-300' : 
                        'bg-gray-600 text-gray-300'}`}
                    >
                      {request.status === 'pending' ? 'В изчакване' : 
                       request.status === 'approved' ? 'Одобрена' : 'Отказана'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-300">
                    <div>
                      <span className="text-gray-400">От: </span>
                      {request.startDate}
                    </div>
                    <div>
                      <span className="text-gray-400">До: </span>
                      {request.endDate}
                    </div>
                    <div>
                      <span className="text-gray-400">Обща цена: </span>
                      {request.totalPrice}
                    </div>
                  </div>

                  <div className="mt-4 bg-gray-600/50 p-4 rounded-lg">
                    <p className="text-gray-300 text-sm">{request.message}</p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        if (window.confirm('Сигурни ли сте, че искате да изтриете тази заявка?')) {
                          setMyRequests(prev => prev.filter(r => r.id !== request.id));
                        }
                      }}
                      className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      Изтрий заявката
                    </button>
                    <button
                      onClick={() => {
                        const equipment = findEquipmentByRequest(request);
                        setSelectedEquipment(equipment);
                        setEditingRequest({
                          startDate: request.startDate,
                          endDate: request.endDate,
                          message: request.message
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
  const PublishEquipmentModal = ({ equipment, onClose, isEditing }) => {
    const [formData, setFormData] = useState(
      equipment ? {
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
      } : {
        title: '',
        description: '',
        price: '',
        location: '',
        category: 'tools',
        images: [],
        owner: 'Иван Иванов', // Default owner
        contact: '', // Default contact
        specifications: {}
      }
    );

    const handleSubmit = (e) => {
      e.preventDefault();
      if (isEditing) {
        // Логика за редактиране на съществуваща обява
        console.log('Updating equipment:', formData);
      } else {
        // Логика за създаване на нова обява
        console.log('Creating new equipment:', formData);
      }
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isEditing ? 'Редактиране на обява' : 'Публикуване на обява'}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  Категория
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
                >
                  <option value="tools">Инструменти</option>
                  <option value="construction">Строително оборудване</option>
                  <option value="machinery">Машини</option>
                  <option value="other">Друго</option>
                </select>
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
                    Цена (на ден)
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200"
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Снимки
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <div className="flex text-sm text-gray-400">
                      <label className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-white hover:text-gray-200 px-3 py-2">
                        <span>Качи снимки</span>
                        <input type="file" multiple className="sr-only" accept="image/*" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-400">PNG, JPG до 10MB</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Отказ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  {isEditing ? 'Запази промените' : 'Публикувай'}
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
    </div>
  );
};

export default EquipmentPage; 