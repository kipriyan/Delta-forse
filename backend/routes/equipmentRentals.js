const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createRental,
  getMyRentals,
  getReceivedRentals,
  getRentalById,
  updateRentalStatus,
  deleteRental,
  updateRental
} = require('../controllers/equipmentRentalController');

// Основни маршрути
router.route('/')
  .post(protect, createRental);

// Моите заявки за наемане
router.get('/my', protect, getMyRentals);

// Получени заявки за наемане
router.get('/received', protect, getReceivedRentals);

// Маршрути за конкретна заявка
router.route('/:id')
  .get(protect, getRentalById)
  .put(protect, updateRental)
  .delete(protect, deleteRental);

// Обновяване на статуса
router.put('/:id/status', protect, updateRentalStatus);

module.exports = router; 