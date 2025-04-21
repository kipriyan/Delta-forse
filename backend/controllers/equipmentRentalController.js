const EquipmentRental = require('../models/EquipmentRental');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');

// @desc    Получаване на моите заявки за наемане
// @route   GET /api/equipment-rentals/my
// @access  Private
exports.getMyRentals = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const result = await EquipmentRental.findByUserId(req.user.id, page, limit);
  
  res.status(200).json({
    success: true,
    count: result.rentals.length,
    pagination: result.pagination,
    data: result.rentals
  });
});

// @desc    Получаване на заявки за наемане на моята екипировка
// @route   GET /api/equipment-rentals/received
// @access  Private
exports.getReceivedRentals = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const result = await EquipmentRental.findByOwnerId(req.user.id, page, limit);
  
  res.status(200).json({
    success: true,
    count: result.rentals.length,
    pagination: result.pagination,
    data: result.rentals
  });
});

// @desc    Получаване на конкретна заявка за наемане
// @route   GET /api/equipment-rentals/:id
// @access  Private
exports.getRentalById = asyncHandler(async (req, res, next) => {
  const rental = await EquipmentRental.findById(req.params.id);
  
  if (!rental) {
    return next(new ErrorResponse(`Не е намерена заявка с ID ${req.params.id}`, 404));
  }
  
  // Проверка дали потребителят има права да вижда тази заявка
  if (rental.user_id !== req.user.id && rental.owner_id !== req.user.id && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Нямате права да видите тази заявка', 403));
  }
  
  res.status(200).json({
    success: true,
    data: rental
  });
});

// @desc    Обновяване на статуса на заявка за наемане
// @route   PUT /api/equipment-rentals/:id/status
// @access  Private
exports.updateRentalStatus = asyncHandler(async (req, res, next) => {
  const { status, message } = req.body;
  
  // Проверка за валиден статус според базата данни
  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!status || !validStatuses.includes(status)) {
    return next(new ErrorResponse(`Невалиден статус. Позволени: ${validStatuses.join(', ')}`, 400));
  }
  
  // Намиране на заявката
  const rental = await EquipmentRental.findById(req.params.id);
  
  if (!rental) {
    return next(new ErrorResponse(`Не е намерена заявка с ID ${req.params.id}`, 404));
  }
  
  // Проверка за права
  // - Собственикът може да одобри или отхвърли
  // - Наемателят може да откаже
  // - И двамата могат да маркират като приключена
  let hasPermission = false;
  
  if (status === 'approved' || status === 'rejected') {
    hasPermission = rental.owner_id === req.user.id;
  } else if (status === 'cancelled') {
    hasPermission = rental.user_id === req.user.id && rental.status === 'pending';
  } else if (status === 'completed') {
    hasPermission = (rental.owner_id === req.user.id || rental.user_id === req.user.id) && 
                    rental.status === 'approved';
  }
  
  if (!hasPermission && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Нямате права да променяте статуса на тази заявка', 403));
  }
  
  // Обновяване на статуса
  const updatedRental = await EquipmentRental.updateStatus(req.params.id, status, message);
  
  res.status(200).json({
    success: true,
    data: updatedRental
  });
});

// @desc    Изтриване на заявка за наемане
// @route   DELETE /api/equipment-rentals/:id
// @access  Private
exports.deleteRental = asyncHandler(async (req, res, next) => {
  const rental = await EquipmentRental.findById(req.params.id);
  
  if (!rental) {
    return next(new ErrorResponse(`Не е намерена заявка с ID ${req.params.id}`, 404));
  }
  
  // Проверка за права - само създателят на заявката може да я изтрие,
  // и то само ако е в статус "pending" или "rejected"
  if (rental.user_id !== req.user.id && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Нямате права да изтриете тази заявка', 403));
  }
  
  if (rental.status !== 'pending' && rental.status !== 'rejected' && rental.status !== 'cancelled' && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Можете да изтриете само заявки със статус чакащи, отхвърлени или отменени', 400));
  }
  
  // Изтриване на заявката
  await EquipmentRental.delete(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Създаване на нова заявка за наемане
// @route   POST /api/equipment-rentals
// @access  Private
exports.createRental = asyncHandler(async (req, res, next) => {
  try {
    // Валидация на входните данни
    const { equipment_id, start_date, end_date, message } = req.body;
    
    if (!equipment_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Моля, попълнете всички задължителни полета'
      });
    }
    
    // Проверка дали оборудването съществува
    const [equipmentCheck] = await pool.execute(
      'SELECT id, user_id FROM equipment WHERE id = ? AND status = "available"',
      [equipment_id]
    );
    
    if (equipmentCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Оборудването не съществува или не е налично'
      });
    }
    
    // Проверка дали потребителят не се опитва да наеме собственото си оборудване
    if (equipmentCheck[0].user_id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Не можете да наемете собственото си оборудване'
      });
    }
    
    // Добавяне на user_id от аутентикирания потребител
    req.body.user_id = req.user.id;
    
    // Създаване на заявката за наемане
    const rental = await EquipmentRental.create(req.body);
    
    res.status(201).json({
      success: true,
      data: rental
    });
  } catch (error) {
    console.error('Грешка при създаване на заявка за наемане:', error);
    res.status(500).json({
      success: false,
      error: 'Сървърна грешка при създаване на заявката'
    });
  }
}); 