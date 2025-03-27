const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  searchEquipment,
  getMyEquipment,
  getEquipmentCategories
} = require('../controllers/equipmentController');
const { pool } = require('../config/db');

// Основни маршрути
router.route('/')
  .post(protect, createEquipment)
  .get(getAllEquipment);

// Маршрут за категории
router.get('/categories', getEquipmentCategories);

// Маршрут за търсене
router.get('/search', searchEquipment);

// Маршрут за моята екипировка
router.get('/my', protect, getMyEquipment);

// Маршрути за конкретна екипировка
router.route('/:id')
  .get(getEquipmentById)
  .put(protect, updateEquipment)
  .delete(protect, deleteEquipment);

// Прост маршрут за тестване
router.get('/test', (req, res) => {
  console.log('GET /api/equipment/test е извикан');
  res.json({ success: true, message: 'Equipment API работи' });
});

// Опростена версия на маршрута за създаване
router.post('/', protect, async (req, res) => {
  const { title, description, category, condition, daily_rate, location } = req.body;
  const userId = req.user.id;
  
  // Валидация на входните данни
  if (!title || !description || !daily_rate || !location) {
    return res.status(400).json({
      success: false,
      error: 'Моля, попълнете всички задължителни полета'
    });
  }
  
  try {
    // Създаване на запис в базата данни
    const [result] = await pool.execute(
      `INSERT INTO equipment_listings 
       (user_id, title, description, category, equipment_condition, daily_rate, location, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'available', NOW())`,
      [userId, title, description, category, condition, daily_rate, location]
    );
    
    if (result.insertId) {
      // Извличане на създадената обява
      const [equipment] = await pool.query(
        'SELECT * FROM equipment_listings WHERE id = ?',
        [result.insertId]
      );
      
      res.status(201).json({
        success: true,
        data: equipment[0]
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Неуспешно създаване на обявата'
      });
    }
  } catch (error) {
    console.error('Грешка при създаване на обява за екипировка:', error);
    res.status(500).json({
      success: false,
      error: 'Сървърна грешка при създаване на обявата'
    });
  }
});

// Получаване на всички обяви
router.get('/', async (req, res) => {
  try {
    const [equipment] = await pool.query(
      'SELECT * FROM equipment_listings WHERE status = "available" ORDER BY created_at DESC'
    );
    
    res.status(200).json({
      success: true,
      count: equipment.length,
      data: equipment
    });
  } catch (error) {
    console.error('ERROR при обработка на POST /api/equipment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Грешка при създаване на обявата'
    });
  }
});

module.exports = router; 