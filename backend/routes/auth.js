const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  getMe, 
  updateDetails, 
  updatePassword, 
  forgotPassword, 
  resetPassword, 
  checkAuthStatus 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegistration } = require('../middleware/validator');

// Регистрация
router.post('/register', validateRegistration, register);

// Вход
router.post('/login', login);

// Получаване на текущия потребител
router.get('/me', protect, getMe);

// Обновяване на потребителски данни
router.put('/updatedetails', protect, updateDetails);

// Смяна на парола
router.put('/updatepassword', protect, updatePassword);

// Заявка за възстановяване на парола
router.post('/forgotpassword', forgotPassword);

// Възстановяване на парола
router.put('/resetpassword/:resettoken', resetPassword);

// Изход
router.get('/logout', protect, logout);

// Проверка на статуса на аутентикация
router.get('/status', checkAuthStatus);

module.exports = router; 