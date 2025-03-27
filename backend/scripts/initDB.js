const initializeDatabase = require('../config/initDB');

// Инициализиране на базата данни
initializeDatabase()
  .then(() => {
    console.log('База данни успешно инициализирана');
    process.exit(0);
  })
  .catch(err => {
    console.error('Грешка при инициализиране на базата данни:', err);
    process.exit(1);
  }); 