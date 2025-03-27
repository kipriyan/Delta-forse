const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Нов прост контролер за получаване на обяви за работа
exports.getAllJobs = asyncHandler(async (req, res) => {
  console.log('getAllJobs: Започва изпълнение');
  
  try {
    // Създаваме директна връзка
    const connection = await pool.getConnection();
    console.log('getAllJobs: Връзка с базата данни установена');
    
    // Проста заявка без параметри
    const [rows] = await connection.query('SELECT * FROM job_listings');
    connection.release();
    
    console.log(`getAllJobs: Заявката изпълнена успешно, върнати ${rows ? rows.length : 0} реда`);
    
    // Отговор без достъп до .length
    return res.json({
      success: true,
      data: rows || []
    });
  } catch (error) {
    console.error('getAllJobs ERROR:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Грешка при извличане на обявите'
    });
  }
}); 