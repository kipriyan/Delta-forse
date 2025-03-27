const fs = require('fs');
const path = require('path');

// Път към файла jobsController.js
const controllerPath = path.join(__dirname, '..', 'controllers', 'jobsController.js');

// Прочитане на файла
try {
  const content = fs.readFileSync(controllerPath, 'utf8');
  
  // Разделяне на редовете
  const lines = content.split('\n');
  
  // Показване на проблемния ред и няколко реда преди и след него
  console.log('=== Съдържание на jobsController.js около ред 49 ===');
  for (let i = Math.max(0, 45); i < Math.min(lines.length, 55); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
  
  console.log('\nСъдържание на проблемния ред:');
  console.log(`49: ${lines[48]}`);
} catch (error) {
  console.error('Грешка при четене на файла:', error);
} 