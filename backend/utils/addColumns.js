const { pool } = require('../config/db');
require('dotenv').config();

async function addColumnsToJobApplications() {
  console.log('Започване на добавянето на колони към job_applications...');
  
  try {
    const connection = await pool.getConnection();
    
    // Проверяваме структурата на таблицата
    console.log('Проверка на текущата структура на таблицата...');
    const [columns] = await connection.query('DESCRIBE job_applications');
    const columnNames = columns.map(col => col.Field);
    
    console.log('Текущи колони:', columnNames.join(', '));
    
    // Проверка дали колоните вече съществуват
    const needResumeUrl = !columnNames.includes('resume_url');
    const needResumeFile = !columnNames.includes('resume_file');
    
    // Добавяне на колоните, ако не съществуват
    if (needResumeUrl || needResumeFile) {
      let alterQuery = 'ALTER TABLE job_applications';
      
      if (needResumeUrl) {
        alterQuery += ' ADD COLUMN resume_url VARCHAR(255) NULL,';
      }
      
      if (needResumeFile) {
        alterQuery += ' ADD COLUMN resume_file VARCHAR(255) NULL,';
      }
      
      // Премахване на последната запетая
      alterQuery = alterQuery.slice(0, -1);
      
      console.log('Изпълняване на заявка за добавяне на колони:');
      console.log(alterQuery);
      
      await connection.query(alterQuery);
      console.log('✅ Колоните са добавени успешно!');
    } else {
      console.log('Колоните вече съществуват, не е необходима промяна.');
    }
    
    // Повторна проверка на структурата
    const [newColumns] = await connection.query('DESCRIBE job_applications');
    console.log('Обновена структура на таблицата:');
    console.log(newColumns.map(col => `${col.Field} (${col.Type})`).join('\n'));
    
    connection.release();
    console.log('Операцията завършена успешно.');
  } catch (error) {
    console.error('Грешка при добавяне на колони:', error);
  } finally {
    process.exit(0);
  }
}

// Изпълнение на функцията
addColumnsToJobApplications(); 