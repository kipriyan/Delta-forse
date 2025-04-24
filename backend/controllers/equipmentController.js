const Equipment = require('../models/Equipment');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const { pool } = require('../config/db');
const EquipmentRental = require('../models/EquipmentRental');

// @desc    Създаване на нова обява за екипировка
// @route   POST /api/equipment
// @access  Private
exports.createEquipment = asyncHandler(async (req, res, next) => {
  try {
    // Добавяне на user_id от аутентикирания потребител
    req.body.user_id = req.user.id;
    
    // Преобразуваме price от лева в число
    if (req.body.price && typeof req.body.price === 'string') {
      req.body.price = parseFloat(req.body.price.replace(/[^\d.-]/g, ''));
    }
    
    // Валидация на задължителни полета
    if (!req.body.title || !req.body.description || req.body.price === undefined || !req.body.location) {
      return res.status(400).json({
        success: false,
        error: 'Моля, попълнете всички задължителни полета'
      });
    }
    
    // Създаване на обявата за екипировка
    const equipment = await Equipment.create(req.body);
    
    res.status(201).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Грешка при създаване на екипировка:', error);
    res.status(500).json({
      success: false,
      error: 'Сървърна грешка при създаване на обявата'
    });
  }
});

// @desc    Получаване на всички обяви за екипировка
// @route   GET /api/equipment
// @access  Public
exports.getAllEquipment = asyncHandler(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log('Получена заявка за оборудване:', { page, limit, query: req.query });
    
    // Извличаме оборудването с подробна информация за собствениците
    const result = await Equipment.findAll(page, limit, req.query);
    
    // Проверка за данни за собствениците
    if (result.equipment.length > 0) {
      result.equipment.forEach(item => {
        if (!item.owner_name) {
          console.warn(`Оборудване ID ${item.id} няма данни за собственик`);
        }
      });
    }
    
    // Връщаме данните с ясно структуриран формат
    res.json({
      success: true,
      count: result.equipment.length,
      pagination: result.pagination,
      data: result.equipment.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        category: item.category,
        status: item.status,
        location: item.location,
        image_url: item.image_url,
        is_available: item.is_available,
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        owner_name: item.owner_name || 'Неизвестен потребител',
        owner_email: item.owner_email || 'Няма данни за контакт'
      }))
    });
  } catch (err) {
    console.error('Грешка при извличане на оборудване:', err);
    res.status(500).json({
      success: false,
      error: 'Грешка при извличане на оборудване'
    });
  }
});

// @desc    Получаване на конкретна екипировка по ID
// @route   GET /api/equipment/:id
// @access  Public
exports.getEquipmentById = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.findById(req.params.id);
  
  if (!equipment) {
    return next(new ErrorResponse(`Не е намерена екипировка с ID ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: equipment
  });
});

// @desc    Обновяване на екипировка
// @route   PUT /api/equipment/:id
// @access  Private
exports.updateEquipment = asyncHandler(async (req, res, next) => {
  // Намиране на екипировката
  let equipment = await Equipment.findById(req.params.id);
  
  if (!equipment) {
    return next(new ErrorResponse(`Не е намерена екипировка с ID ${req.params.id}`, 404));
  }
  
  // Проверка за права (само собственикът или админ може да обновява)
  if (equipment.user_id !== req.user.id && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Нямате права да редактирате тази екипировка', 403));
  }
  
  // Обновяване на екипировката
  equipment = await Equipment.update(req.params.id, req.body);
  
  res.status(200).json({
    success: true,
    data: equipment
  });
});

// @desc    Изтриване на екипировка
// @route   DELETE /api/equipment/:id
// @access  Private
exports.deleteEquipment = asyncHandler(async (req, res, next) => {
  // Намиране на екипировката
  const equipment = await Equipment.findById(req.params.id);
  
  if (!equipment) {
    return next(new ErrorResponse(`Не е намерена екипировка с ID ${req.params.id}`, 404));
  }
  
  // Проверка за права (само собственикът или админ може да изтрива)
  if (equipment.user_id !== req.user.id && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Нямате права да изтриете тази екипировка', 403));
  }
  
  // Изтриване на екипировката
  await Equipment.delete(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Търсене на екипировка
// @route   GET /api/equipment/search
// @access  Public
exports.searchEquipment = asyncHandler(async (req, res, next) => {
  const { query } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (!query) {
    return next(new ErrorResponse('Моля, въведете критерии за търсене', 400));
  }
  
  const result = await Equipment.search(query, page, limit);
  
  res.status(200).json({
    success: true,
    count: result.equipment.length,
    pagination: result.pagination,
    data: result.equipment
  });
});

// @desc    Получаване на оборудване на текущия потребител
// @route   GET /api/equipment/my
// @access  Private
exports.getMyEquipment = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  try {
    console.log(`Аутентикиран потребител: ${req.user.email}`);
    console.log(`Извличане на оборудване за потребител с ID: ${userId}`);
    
    const equipment = await Equipment.findByUserId(userId);
    
    console.log(`Намерени ${equipment.length} бр. оборудване за потребителя`);
    
    return res.status(200).json({
      success: true,
      count: equipment.length,
      data: equipment
    });
  } catch (error) {
    console.error(`Equipment findByUserId error:`, error);
    return next(new ErrorResponse('Сървърна грешка при извличане на оборудването', 500));
  }
});

// @desc    Получаване на категории екипировка
// @route   GET /api/equipment/categories
// @access  Public
exports.getEquipmentCategories = asyncHandler(async (req, res, next) => {
  // Получаване на всички уникални категории от екипировката
  const [categories] = await pool.execute(`
    SELECT DISTINCT category
    FROM equipment
    WHERE category IS NOT NULL
    ORDER BY category ASC
  `);
  
  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories.map(item => item.category)
  });
}); 