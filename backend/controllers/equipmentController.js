const Equipment = require('../models/Equipment');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const { pool } = require('../config/db');

// @desc    Създаване на нова обява за екипировка
// @route   POST /api/equipment
// @access  Private
exports.createEquipment = asyncHandler(async (req, res, next) => {
  // Добавяне на user_id от аутентикирания потребител
  req.body.user_id = req.user.id;
  
  // Създаване на обявата за екипировка
  const equipment = await Equipment.create(req.body);
  
  res.status(201).json({
    success: true,
    data: equipment
  });
});

// @desc    Получаване на всички обяви за екипировка
// @route   GET /api/equipment
// @access  Public
exports.getAllEquipment = asyncHandler(async (req, res, next) => {
  // Извличане на параметрите за филтриране от заявката
  const {
    page = 1,
    limit = 10,
    category,
    location,
    condition,
    min_daily_rate,
    max_daily_rate,
    status,
    available_from
  } = req.query;
  
  // Създаване на обект с филтрите
  const filters = {
    category,
    location,
    condition,
    min_daily_rate,
    max_daily_rate,
    status,
    available_from
  };
  
  // Филтриране само по валидни филтри (не undefined)
  Object.keys(filters).forEach(key => {
    if (filters[key] === undefined) {
      delete filters[key];
    }
  });
  
  // Получаване на екипировката от базата данни
  const result = await Equipment.findAll(page, limit, filters);
  
  res.status(200).json({
    success: true,
    count: result.equipment.length,
    pagination: result.pagination,
    data: result.equipment
  });
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
    console.log(`Извличане на оборудване за потребител с ID: ${userId}`);
    
    // Извличане на оборудването на потребителя с допълнителна информация
    const [equipment] = await pool.execute(`
      SELECT 
        e.*,
        u.username as owner_name,
        u.email as owner_email
      FROM 
        equipment e
      JOIN 
        users u ON e.user_id = u.id
      WHERE 
        e.user_id = ?
      ORDER BY 
        e.created_at DESC
    `, [userId]);
    
    console.log(`Намерени ${equipment.length} бр. оборудване за потребителя`);
    
    return res.status(200).json({
      success: true,
      count: equipment.length,
      data: equipment
    });
  } catch (error) {
    console.error(`Грешка при извличане на оборудването за потребител ${userId}:`, error);
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