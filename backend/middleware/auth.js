const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const config = require('../config/config');

// Опитваме различни начини за импортиране
let db;
try {
  db = require('../config/db');
  console.log('Успешно импортиран db:', Object.keys(db));
} catch (error) {
  console.error('Грешка при импортиране на db:', error);
}

// Защита на рутове
exports.protect = async (req, res, next) => {
  let token;
  
  // Проверка дали заглавието Authorization съществува и започва с "Bearer "
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Вземаме само токена (премахваме "Bearer ")
      token = req.headers.authorization.split(' ')[1];
      
      console.log('Получен токен:', token.substring(0, 15) + '...');
      
      // Декодираме токена
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Декодиран токен:', decoded);
      
      // Проверяваме дали потребителят съществува
      // Опитваме няколко начина за достъп до пул обекта
      let user;
      if (db && db.pool && typeof db.pool.execute === 'function') {
        const [rows] = await db.pool.execute('SELECT id, username, email FROM users WHERE id = ?', [decoded.id]);
        user = rows[0];
      } else if (db && typeof db.execute === 'function') {
        const [rows] = await db.execute('SELECT id, username, email FROM users WHERE id = ?', [decoded.id]);
        user = rows[0];
      } else if (db && typeof db.query === 'function') {
        const result = await new Promise((resolve, reject) => {
          db.query('SELECT id, username, email FROM users WHERE id = ?', [decoded.id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        user = result[0];
      } else {
        console.error('Не може да се намери валиден метод в db:', db);
        return res.status(500).json({
          success: false,
          error: 'Грешка при свързване с базата данни'
        });
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Потребителят не съществува'
        });
      }
      
      // Добавяме потребителя към обекта на заявката
      req.user = user;
      console.log('Аутентикиран потребител:', req.user.email);
      
      next();
    } catch (error) {
      console.error('Грешка при декодиране на токена:', error);
      return res.status(401).json({
        success: false,
        error: 'Невалиден токен',
        details: error.message
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      error: 'Нямате достъп до този ресурс'
    });
  }
};

// Защита на рутове по роля на потребителя
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Премахваме проверката за роли - всеки потребител може да достъпва ресурса
    next();
  };
}; 