const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  
  error.message = err.message;
  
  // Лог на грешката за дебъгване
  console.log(err);

  // MySQL грешка за дублирани записи
  if (err.code === 'ER_DUP_ENTRY') {
    const message = 'Този запис вече съществува';
    error = new ErrorResponse(message, 400);
  }

  // MySQL грешка - нарушение на foreign key constraint
  if (err.code === 'ER_NO_REFERENCED_ROW') {
    const message = 'Референтният запис не съществува';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose лошо ObjectId
  if (err.name === 'CastError') {
    const message = `Ресурсът не е намерен`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose дублирана стойност
  if (err.code === 11000) {
    const message = 'Въведена е дублирана стойност';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose грешки при валидация
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Сървърна грешка'
  });
};

module.exports = errorHandler; 