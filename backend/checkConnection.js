const { pool } = require('./config/db');
require('dotenv').config();

console.log('=== ПРОВЕРКА НА ВРЪЗКАТА С БАЗАТА ДАННИ ===');
console.log('Настройки на средата:');
console.log(`DB_HOST: ${process.env.DB_HOST || 'не е зададен, използва се по подразбиране'}`);
console.log(`DB_USER: ${process.env.DB_USER || 'не е зададен, използва се по подразбиране'}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '*****' : 'не е зададен, използва се по подразбиране'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || 'не е зададен, използва се по подразбиране'}`);

async function testDatabaseConnection() {
  try {
    // Тест 1: Проверка на връзката
    console.log('\nТест 1: Проверка на връзката...');
    const connection = await pool.getConnection();
    console.log('✅ Успешно свързване с базата данни!');
    
    // Тест 2: Проверка на текущата база данни
    console.log('\nТест 2: Проверка на текущата база данни...');
    const [dbResult] = await connection.query('SELECT DATABASE() as current_db');
    console.log(`✅ Текуща база данни: ${dbResult[0].current_db}`);
    
    // Тест 3: Проверка за наличие на таблицата job_listings
    console.log('\nТест 3: Проверка за таблица job_listings...');
    const [tables] = await connection.query(`SHOW TABLES LIKE 'job_listings'`);
    
    if (tables.length === 0) {
      console.log('❌ Таблицата job_listings НЕ съществува в текущата база данни!');
    } else {
      console.log('✅ Таблицата job_listings съществува.');
      
      // Тест 4: Извличане на данни от таблицата
      console.log('\nТест 4: Извличане на обяви за работа...');
      const [jobs] = await connection.query('SELECT * FROM job_listings LIMIT 10');
      
      if (jobs.length === 0) {
        console.log('⚠️ Таблицата job_listings е празна!');
      } else {
        console.log(`✅ Намерени ${jobs.length} обяви за работа.`);
        console.log('Първа обява:');
        console.log(jobs[0]);
      }
      
      // Тест 5: Използване на същия код като в контролера
      console.log('\nТест 5: Използване на pool.query като в контролера...');
      const [rows] = await pool.query('SELECT * FROM job_listings WHERE status = "active" LIMIT 10');
      
      if (!rows) {
        console.log('❌ rows е undefined!');
      } else {
        console.log(`✅ rows е дефиниран, съдържа ${rows.length} елемента.`);
      }
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ ГРЕШКА при тестване на базата данни:', error);
  } finally {
    console.log('\n=== КРАЙ НА ПРОВЕРКАТА ===');
    process.exit(0);
  }
}

testDatabaseConnection(); 