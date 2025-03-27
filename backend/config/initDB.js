const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

const initializeDatabase = async () => {
  try {
    console.log('Инициализиране на базата данни...');
    
    // Четене на SQL файла
    const sqlFilePath = path.join(__dirname, '..', 'database', 'schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Разделяне на SQL заявките
    const queries = sql.split(';').filter(query => query.trim() !== '');
    
    // Изпълняване на всяка заявка
    for (const query of queries) {
      await pool.execute(query + ';');
    }
    
    console.log('Базата данни е инициализирана успешно!');
  } catch (error) {
    console.error('Грешка при инициализиране на базата данни:', error);
    process.exit(1);
  }
};

module.exports = initializeDatabase; 