const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
  // Създаваме връзка с базата данни
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'job_portal'
  });

  console.log('Свързване с базата данни...');

  try {
    // Проверка дали таблицата job_listings съществува
    console.log('Проверка за таблица job_listings...');
    const [tables] = await connection.query('SHOW TABLES LIKE "job_listings"');
    
    if (tables.length === 0) {
      console.log('ГРЕШКА: Таблицата job_listings не съществува!');
      return;
    }

    console.log('✅ Таблицата job_listings съществува.');

    // Преглед на структурата на таблицата
    console.log('Структура на таблицата job_listings:');
    const [columns] = await connection.query('DESCRIBE job_listings');
    console.log(columns.map(col => `${col.Field} (${col.Type})`).join('\n'));

    // Преглед на съдържанието на таблицата
    console.log('\nПреглед на данните в job_listings:');
    const [rows] = await connection.query('SELECT * FROM job_listings LIMIT 10');
    
    if (rows.length === 0) {
      console.log('Няма записи в таблицата job_listings');
      
      // Ръчно добавяне на тестова обява
      console.log('\nДобавяне на тестова обява...');
      const [users] = await connection.query('SELECT id FROM users LIMIT 1');
      
      if (!users || users.length === 0) {
        console.log('ГРЕШКА: Няма потребители в базата данни!');
        return;
      }

      const userId = users[0].id;
      
      // Вмъкваме тестова обява
      await connection.execute(
        `INSERT INTO job_listings 
         (title, description, location, job_type, salary, requirements, user_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          'Тестова позиция',
          'Това е тестова обява за работа',
          'София',
          'full-time',
          '2000-3000',
          'Няма специални изисквания',
          userId,
          'active'
        ]
      );
      
      console.log('✅ Тестовата обява е добавена успешно!');
      
      // Проверка дали обявата е добавена
      const [newRows] = await connection.query('SELECT * FROM job_listings LIMIT 10');
      console.log(`Брой обяви след добавянето: ${newRows.length}`);
      console.log(JSON.stringify(newRows, null, 2));
    } else {
      console.log(`Намерени ${rows.length} обяви:`);
      console.log(JSON.stringify(rows, null, 2));
    }

  } catch (error) {
    console.error('ГРЕШКА при работа с базата данни:', error);
  } finally {
    console.log('Затваряне на връзката с базата данни...');
    await connection.end();
  }
}

// Изпълняване на проверката
checkDatabase().catch(err => {
  console.error('Неочаквана грешка:', err);
  process.exit(1);
}); 