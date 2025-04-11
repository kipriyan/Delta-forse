/**
 * Скрипт за тестване на API
 * 
 * Инструкции за употреба:
 * 1. Инсталирайте необходимите пакети: npm install axios chalk inquirer dotenv
 * 2. Създайте .env файл с правилните настройки за вашата среда
 * 3. Стартирайте скрипта: node api-test.js
 */

const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Зареждане на променливите от средата
dotenv.config();

// Глобални настройки
const API_URL = process.env.API_URL || 'http://localhost:5000';
const TIMEOUT = process.env.TIMEOUT || 10000;

// Глобални променливи за съхранение на токена и потребителя
let currentToken = null;
let currentUser = null;
let tokenTimestamp = null;

// Функция за изпълнение на заявка
const makeRequest = async (method, endpoint, data = null, files = null) => {
  try {
    const headers = {};
    
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }
    
    let url = API_URL + endpoint;
    
    // Ако имаме GET заявка с данни, добавяме ги като параметри
    if (method.toLowerCase() === 'get' && data) {
      const params = new URLSearchParams(data);
      url += `?${params.toString()}`;
    }
    
    let response;
    
    if (files) {
      const formData = new FormData();
      
      // Добавяме обикновените данни
      if (data) {
        Object.keys(data).forEach(key => {
          formData.append(key, data[key]);
        });
      }
      
      // Добавяме файловете
      Object.keys(files).forEach(key => {
        formData.append(key, files[key]);
      });
      
      response = await axios({
        method,
        url,
        data: formData,
        headers: {
          ...headers,
          ...formData.getHeaders()
        },
        timeout: TIMEOUT
      });
    } else {
      console.log(`Ще изпратим заявка към: ${API_URL}${endpoint}`);
      response = await axios({
        method,
        url,
        data: method.toLowerCase() !== 'get' ? data : undefined,
        headers,
        timeout: TIMEOUT
      });
    }
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    let errorMsg = 'Неизвестна грешка';
    
    if (error.response) {
      // Получен е отговор от сървъра със статус код извън 2xx
      errorMsg = error.response.data.error || error.response.data.message || `Грешка ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      // Заявката е направена, но няма отговор
      errorMsg = 'Няма отговор от сървъра. Моля, проверете дали сървърът работи.';
    } else {
      // Нещо се е случило при настройката на заявката
      errorMsg = error.message;
    }
    
    return {
      success: false,
      error: errorMsg
    };
  }
};

// Функция за регистрация на потребител
const register = async () => {
  console.log(chalk.blue('\n=== Регистрация на потребител ==='));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: 'Въведете потребителско име:',
      validate: input => input.length > 0 ? true : 'Потребителското име е задължително'
    },
    {
      type: 'input',
      name: 'email',
      message: 'Въведете имейл:',
      validate: input => /\S+@\S+\.\S+/.test(input) ? true : 'Моля, въведете валиден имейл адрес'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Въведете парола:',
      validate: input => input.length >= 6 ? true : 'Паролата трябва да е поне 6 символа'
    },
    {
      type: 'list',
      name: 'user_type',
      message: 'Изберете тип потребител:',
      choices: [
        { name: 'Физическо лице', value: 'person' },
        { name: 'Компания', value: 'company' }
      ]
    }
  ]);
  
  // Изпращаме данните към сървъра
  const result = await makeRequest('POST', '/api/auth/register', {
    username: answers.username,
    email: answers.email,
    password: answers.password,
    user_type: answers.user_type
  });
  
  if (result.success) {
    console.log(chalk.green('✅ Регистрацията е успешна!'));
    console.log('Отговор от сървъра:', JSON.stringify(result.data, null, 2));
    
    // Запазваме токена
    currentToken = result.data.token;
    
    // Запазваме потребителя - ако е празен обект, използваме входните данни
    if (result.data.user && Object.keys(result.data.user).length > 0) {
      currentUser = result.data.user;
    } else {
      // Използваме входните данни, ако сървърът не върне потребителска информация
      currentUser = {
        username: answers.username,
        email: answers.email,
        user_type: answers.user_type
      };
    }
    
    console.log(chalk.green(`Добре дошли, ${answers.username}!`));
    
    return result.data;
  } else {
    console.log(chalk.red(`❌ Грешка при регистрация: ${result.error || 'Неизвестна грешка'}`));
    return null;
  }
};

// Актуализирана функция за вход, която правилно съхранява токена
const login = async () => {
  console.log(chalk.blue('\n=== Вход в системата ==='));
  
  const { email } = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Въведете имейл:',
      validate: input => input.includes('@') ? true : 'Моля, въведете валиден имейл'
    }
  ]);
  
  const { password } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: 'Въведете парола:',
      mask: '*'
    }
  ]);
  
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: email,
      password: password
    });
    
    if (response.data.success) {
      currentUser = response.data.user;
      currentToken = response.data.token;
      
      console.log(chalk.green(`✅ Успешен вход като: ${currentUser.username}`));
      console.log('Получен токен:', currentToken.substring(0, 15) + '...');
      
      // Съхраняваме времето на влизане, за да можем да проверим дали токенът е изтекъл
      tokenTimestamp = Date.now();
      
      return currentUser;
    } else {
      console.log(chalk.red(`❌ Грешка при вход: ${response.data.error}`));
      return null;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Грешка при вход: ${error.response?.data?.error || error.message}`));
    return null;
  }
};

// Функция за проверка и опресняване на токена ако е необходимо
const refreshTokenIfNeeded = async () => {
  if (!currentToken || !currentUser) return false;
  
  // Проверка дали са минали повече от 55 минути от последното влизане/опресняване
  // (предполагаме, че токенът е валиден за 1 час)
  const tokenAgeMinutes = (Date.now() - tokenTimestamp) / (1000 * 60);
  
  if (tokenAgeMinutes > 55) {
    console.log(chalk.yellow('Токенът може да е изтекъл. Опресняване...'));
    
    try {
      // Вместо да имплементираме endpoint за опресняване, просто правим нов вход
      const { email, password } = await inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: 'Въведете имейл отново за опресняване на сесията:',
          default: currentUser.email
        },
        {
          type: 'password',
          name: 'password',
          message: 'Въведете парола:',
          mask: '*'
        }
      ]);
      
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      if (response.data.success) {
        currentUser = response.data.user;
        currentToken = response.data.token;
        tokenTimestamp = Date.now();
        
        console.log(chalk.green('✅ Токенът е успешно опреснен'));
        return true;
      } else {
        console.log(chalk.red(`❌ Неуспешно опресняване на токена: ${response.data.error}`));
        return false;
      }
    } catch (error) {
      console.error(chalk.red(`❌ Грешка при опресняване на токена: ${error.message}`));
      return false;
    }
  }
  
  return true; // Токенът е все още валиден
};

// Функция за тестване на създаване на обява за работа
const testCreateJob = async () => {
  console.log(chalk.blue('\n=== Създаване на обява за работа ==='));
  
  // Проверка дали потребителят е влязъл в системата
  if (!currentUser) {
    console.log(chalk.red('❌ Трябва да сте влезли в системата, за да създавате обяви за работа'));
    return null;
  }
  
  // Въпроси за обявата
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Въведете заглавие:',
      validate: input => input.length >= 5 ? true : 'Заглавието трябва да е поне 5 символа'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Въведете описание:',
      validate: input => input.length >= 10 ? true : 'Описанието трябва да е поне 10 символа'
    },
    {
      type: 'input',
      name: 'location',
      message: 'Въведете локация:',
      validate: input => input.length > 0 ? true : 'Локацията е задължителна'
    },
    {
      type: 'list',
      name: 'job_type',
      message: 'Изберете тип работа:',
      choices: [
        { name: 'Пълен работен ден', value: 'full-time' },
        { name: 'Непълен работен ден', value: 'part-time' },
        { name: 'Договор', value: 'contract' },
        { name: 'Стаж', value: 'internship' },
        { name: 'Дистанционна', value: 'remote' }
      ]
    },
    {
      type: 'input',
      name: 'salary',
      message: 'Въведете заплата (напр. 1000 или 1000-2000):',
      validate: input => /^\d+-\d+$|^\d+$/.test(input) ? true : 'Невалиден формат за заплата'
    },
    {
      type: 'input',
      name: 'requirements',
      message: 'Въведете изисквания:'
    }
  ]);
  
  // Изпълнение на заявката за създаване на обява
  const result = await makeRequest('POST', '/api/jobs', answers);
  
  // Извеждане на резултата
  if (result.success) {
    console.log(chalk.green('✅ Обявата е създадена успешно!'));
    console.log(chalk.green(`Заглавие: ${result.data.data.title}`));
    console.log(chalk.green(`Локация: ${result.data.data.location}`));
    console.log(chalk.green(`Тип: ${result.data.data.job_type}`));
    
    return result.data;
  } else {
    console.log(chalk.red(`❌ Грешка при създаване на обява: ${result.error || 'Неизвестна грешка'}`));
    return null;
  }
};

// Функция за създаване на обява за екипировка с правилна аутентикация
const createEquipment = async () => {
  console.log(chalk.blue('\n=== Създаване на обява за екипировка ==='));
  
  if (!currentUser) {
    console.log(chalk.red('❌ Трябва да сте влезли в системата, за да създадете обява'));
    return null;
  }
  
  // Проверка и опресняване на токена ако е необходимо
  const isTokenValid = await refreshTokenIfNeeded();
  if (!isTokenValid) {
    console.log(chalk.red('❌ Невалиден токен. Моля, влезте отново в системата.'));
    return null;
  }
  
  const { title } = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Въведете заглавие:',
      validate: input => input.trim() !== '' ? true : 'Заглавието е задължително'
    }
  ]);
  
  const { description } = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Въведете описание:',
      validate: input => input.trim() !== '' ? true : 'Описанието е задължително'
    }
  ]);
  
  const { category } = await inquirer.prompt([
    {
      type: 'input',
      name: 'category',
      message: 'Въведете категория:',
    }
  ]);
  
  const { condition } = await inquirer.prompt([
    {
      type: 'list',
      name: 'condition',
      message: 'Изберете състояние:',
      choices: [
        { name: 'Ново', value: 'new' },
        { name: 'Отлично', value: 'excellent' },
        { name: 'Добро', value: 'good' },
        { name: 'Използвано', value: 'used' }
      ]
    }
  ]);
  
  const { daily_rate } = await inquirer.prompt([
    {
      type: 'input',
      name: 'daily_rate',
      message: 'Въведете дневна цена:',
      validate: input => !isNaN(input) && Number(input) > 0 ? true : 'Цената трябва да бъде положително число'
    }
  ]);
  
  const { location } = await inquirer.prompt([
    {
      type: 'input',
      name: 'location',
      message: 'Въведете локация:',
      validate: input => input.trim() !== '' ? true : 'Локацията е задължителна'
    }
  ]);
  
  // Събиране на всички отговори в един обект
  const answers = {
    title,
    description,
    category,
    condition,
    daily_rate,
    location
  };
  
  try {
    console.log('Създаване на обява за екипировка...');
    console.log(`Ще изпратим заявка към: ${API_URL}/api/equipment`);
    console.log('Данни:', JSON.stringify(answers, null, 2));
    console.log('Използван токен:', currentToken.substring(0, 15) + '...');
    
    const headers = {
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json'
    };
    
    // Опитваме директно с правилен URL
    const response = await axios.post(`${API_URL}/api/equipment`, answers, { headers });
    
    if (response.data && response.data.success) {
      console.log(chalk.green(`✅ Обявата за екипировка създадена успешно! ID: ${response.data.data.id}`));
      return response.data.data;
    } else {
      console.log(chalk.red(`❌ Грешка при създаване на обява: ${response.data ? response.data.error : 'Неизвестна грешка'}`));
      return null;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Грешка при създаване на обява: ${error.message}`));
    
    if (error.response) {
      console.error('Статус код:', error.response.status);
      console.error('Отговор от сървъра:', error.response.data);
      
      if (error.response.status === 401) {
        console.log(chalk.yellow('Съвет: Токенът е невалиден. Опитайте да излезете и да влезете отново.'));
      }
    }
    return null;
  }
};

// Опростена функция за кандидатстване за работа
const applyForJob = async () => {
  console.log(chalk.blue('\n=== Кандидатстване за работа ==='));
  
  try {
    // Директно извикване на axios за по-добър контрол
    console.log('Извикване на GET /api/jobs...');
    const response = await axios.get(`${API_URL}/api/jobs`, {
      headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {}
    });
    
    console.log('Получен отговор:', JSON.stringify(response.data, null, 2));
    
    const jobs = response.data.data;
    
    if (!jobs || !jobs.length) {
      console.log(chalk.red('❌ Няма налични обяви за работа'));
      return null;
    }
    
    console.log(chalk.green(`Намерени ${jobs.length} обяви за работа`));
    
    // Избор на обява
    const { jobId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'jobId',
        message: 'Изберете обява за кандидатстване:',
        choices: jobs.map(job => ({
          name: `${job.title || 'Без заглавие'} (ID: ${job.id})`,
          value: job.id
        }))
      }
    ]);
    
    // Опростено кандидатстване с минимум данни
    const applicationData = {
      cover_letter: 'Тестово мотивационно писмо за кандидатстване'
    };
    
    console.log(chalk.yellow(`Изпращане на POST заявка към /api/jobs/${jobId}/apply...`));
    
    const applyResponse = await axios.post(
      `${API_URL}/api/jobs/${jobId}/apply`,
      applicationData,
      { headers: { Authorization: `Bearer ${currentToken}` } }
    );
    
    console.log(chalk.green('Отговор от сървъра:'));
    console.log(JSON.stringify(applyResponse.data, null, 2));
    
    if (applyResponse.data.success) {
      console.log(chalk.green('✅ Успешно кандидатствахте за работата!'));
      return applyResponse.data.data;
    } else {
      console.log(chalk.red(`❌ Грешка при кандидатстване: ${applyResponse.data.error || 'Неизвестна грешка'}`));
      return null;
    }
  } catch (error) {
    console.error('Грешка при заявката:', error.response?.data || error.message);
    return null;
  }
};

// Функция за тестване на наемане на екипировка
const testRentEquipment = async () => {
console.log(chalk.blue('\n=== Наемане на екипировка ==='));

// Проверка дали потребителят е влязъл в системата
if (!currentUser) {
console.log(chalk.red('❌ Трябва да сте вписани, за да наемате екипировка'));
return null;
}

// Получаване на списък с налична екипировка
const equipmentResult = await makeRequest('get', '/api/equipment', { status: 'available', limit: 10 });

if (!equipmentResult.success || !equipmentResult.data.data.length) {
console.log(chalk.red('❌ Няма налична екипировка за наемане'));
return null;
}

// Избор на екипировка за наемане
const { equipmentId } = await inquirer.prompt([
{
type: 'list',
name: 'equipmentId',
message: 'Изберете екипировка за наемане:',
choices: equipmentResult.data.data.map(equipment => ({
name: `${equipment.title} - ${equipment.daily_rate}лв/ден (${equipment.location})`,
value: equipment.id
}))
}
]);

// Въпроси за наемането
const { rentalStart, rentalEnd, message } = await inquirer.prompt([
{
type: 'input',
name: 'rentalStart',
message: 'Начална дата (ГГГГ-ММ-ДД):',
validate: input => {
const date = new Date(input);
const now = new Date();
now.setHours(0, 0, 0, 0);

if (isNaN(date.getTime())) {
return 'Въведете валидна дата във формат ГГГГ-ММ-ДД';
}

if (date < now) {
return 'Началната дата не може да бъде в миналото';
}

return true;
}
},
{
type: 'input',
name: 'rentalEnd',
message: 'Крайна дата (ГГГГ-ММ-ДД):',
validate: (input, answers) => {
const startDate = new Date(answers.rentalStart);
const endDate = new Date(input);

if (isNaN(endDate.getTime())) {
return 'Въведете валидна дата във формат ГГГГ-ММ-ДД';
}

if (endDate <= startDate) {
return 'Крайната дата трябва да е след началната дата';
}

return true;
}
},
{
type: 'input',
name: 'message',
message: 'Съобщение към собственика (незадължително):'
}
]);

// Подготовка на данните за наемане
const rentalData = {
equipment_id: equipmentId,
rental_start: rentalStart,
rental_end: rentalEnd,
message: message || null
};

// Изпълнение на заявката за наемане
const result = await makeRequest('POST', '/api/equipment-rentals', rentalData);

// Извеждане на резултата
if (result.success) {
console.log(chalk.green('✅ Заявката за наемане е подадена успешно!'));
console.log(chalk.green(`Период: ${rentalStart} до ${rentalEnd}`));
console.log(chalk.green(`Обща цена: ${result.data.data.total_price}лв`));
console.log(chalk.green(`Статус: ${result.data.data.status}`));

return result.data;
} else {
console.log(chalk.red(`❌ Грешка при наемане: ${result.error || 'Неизвестна грешка'}`));
return null;
}
};

// Функция за качване на файл
const testUploadFile = async () => {
console.log(chalk.blue('\n=== Качване на файл ==='));

// Проверка дали потребителят е влязъл в системата
if (!currentUser) {
console.log(chalk.red('❌ Трябва да сте вписани, за да качвате файлове'));
return null;
}

// Избор на тип файл
const { fileType } = await inquirer.prompt([
{
type: 'list',
name: 'fileType',
message: 'Изберете тип файл:',
choices: [
{ name: 'CV', value: 'resume' },
{ name: 'Изображение', value: 'image' },
{ name: 'Документ', value: 'document' }
]
}
]);

// Избор на път до локален файл
const { filePath } = await inquirer.prompt([
{
type: 'input',
name: 'filePath',
message: 'Въведете път до файла на вашия компютър:',
validate: input => {
if (!fs.existsSync(input)) {
return 'Файлът не съществува';
}
return true;
}
}
]);

// Създаване на FormData обект с файла
const formData = new FormData();
formData.append('file', fs.createReadStream(filePath));

// Изпълнение на заявката за качване
const result = await makeRequest('POST', '/api/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Извеждане на резултата
if (result.success) {
console.log(chalk.green('✅ Файлът е качен успешно!'));
console.log(chalk.green(`Име на файла: ${result.data.data.fileName}`));
console.log(chalk.green(`URL: ${result.data.data.fileUrl}`));

return result.data;
} else {
console.log(chalk.red(`❌ Грешка при качване: ${result.error || 'Неизвестна грешка'}`));
return null;
}
};

// Функция за изход от профила
const logout = () => {
  console.log(chalk.blue('\n=== Изход от профила ==='));
  
  if (!currentUser) {
    console.log(chalk.yellow('⚠️ В момента не сте влезли в системата'));
    return;
  }
  
  const previousUser = currentUser.username || currentUser.email;
  
  // Изчистване на информацията за текущия потребител
  currentUser = null;
  currentToken = null;
  
  console.log(chalk.green(`✅ Успешно излязохте от профила на ${previousUser}!`));
};

// Функция за управление на кандидатури с опростена логика и таймаут
const manageApplications = async () => {
  console.log(chalk.blue('\n=== Управление на кандидатури за работа ==='));
  
  if (!currentUser) {
    console.log(chalk.red('❌ Трябва да сте влезли в системата, за да управлявате кандидатури'));
    return null;
  }
  
  try {
    // Първо взимаме всички обяви на текущия потребител с увеличен таймаут
    console.log(chalk.yellow('Извличане на вашите обяви...'));
    
    // Конфигурираме axios с по-голям таймаут
    const jobsResponse = await axios.get(`${API_URL}/api/profile/jobs`, {
      headers: { Authorization: `Bearer ${currentToken}` },
      timeout: 15000 // 15 секунди таймаут
    });
    
    console.log('Отговор получен:', jobsResponse.data);
    
    if (!jobsResponse.data.success || !jobsResponse.data.data || jobsResponse.data.data.length === 0) {
      console.log(chalk.red('❌ Нямате публикувани обяви за работа'));
      return null;
    }
    
    const jobs = jobsResponse.data.data;
    console.log(chalk.green(`Намерени ${jobs.length} ваши обяви`));
    
    // Избор на обява, за която да видите кандидатите
    const { jobId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'jobId',
        message: 'Изберете обява, за да видите кандидатурите:',
        choices: jobs.map(job => ({
          name: `${job.title || 'Без заглавие'} (ID: ${job.id})`,
          value: job.id
        }))
      }
    ]);
    
    // Зареждане на кандидатурите за избраната обява
    console.log(chalk.yellow(`Зареждане на кандидатури за обява ${jobId}...`));
    
    const appsResponse = await axios.get(`${API_URL}/api/jobs/${jobId}/applications`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    
    if (!appsResponse.data.success || !appsResponse.data.data || appsResponse.data.data.length === 0) {
      console.log(chalk.yellow('⚠️ Няма кандидатури за тази обява'));
      return null;
    }
    
    const applications = appsResponse.data.data;
    console.log(chalk.green(`Намерени ${applications.length} кандидатури`));
    
    // Показване на кандидатурите
    applications.forEach((app, index) => {
      console.log(chalk.cyan(`\n--- Кандидатура #${index + 1} ---`));
      console.log(`Кандидат: ${app.username || 'Неизвестен'} (${app.email})`);
      console.log(`Статус: ${app.status}`);
      console.log(`Дата на кандидатстване: ${new Date(app.created_at).toLocaleString()}`);
      console.log(`Мотивационно писмо: ${app.cover_letter}`);
      if (app.resume_url) console.log(`CV URL: ${app.resume_url}`);
    });
    
    // Избиране на кандидатура за промяна на статуса
    const { applicationId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'applicationId',
        message: 'Изберете кандидатура за промяна на статуса:',
        choices: applications.map(app => ({
          name: `${app.username || 'Неизвестен'} (${app.email}) - Текущ статус: ${app.status}`,
          value: app.id
        }))
      }
    ]);
    
    // Промяна на статуса с правилно съпоставяне на стойности
    const { status } = await inquirer.prompt([
      {
        type: 'list',
        name: 'status',
        message: 'Изберете нов статус:',
        choices: [
          { name: 'В процес', value: 'pending' },
          { name: 'Одобряване', value: 'approved' },
          { name: 'Отхвърляне', value: 'rejected' }
        ]
      }
    ]);
    
    console.log(`Промяна на статуса на кандидатурата ${applicationId} на "${status}"...`);
    
    try {
      const updateResponse = await axios.put(
        `${API_URL}/api/jobs/applications/${applicationId}`,
        { status },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      
      if (updateResponse.data.success) {
        console.log(chalk.green('✅ Статусът на кандидатурата е променен успешно!'));
        console.log('Актуализирана кандидатура:');
        console.log(updateResponse.data.data);
        return updateResponse.data.data;
      } else {
        console.log(chalk.red(`❌ Грешка при промяна на статуса: ${updateResponse.data.error}`));
        return null;
      }
    } catch (error) {
      console.error(chalk.red('❌ Грешка при промяна на статуса:'), error.response?.data || error.message);
      return null;
    }
  } catch (error) {
    console.error(chalk.red('❌ Грешка при управление на кандидатури:'), error.message);
    
    // Показване на повече информация за грешката
    if (error.response) {
      console.error('Отговор от сървъра:', error.response.data);
    } else if (error.request) {
      console.error('Проблем със заявката:', error.request);
    }
    
    return null;
  }
};

// Функция за управление на собствените кандидатури
const manageOwnApplications = async () => {
  console.log(chalk.blue('\n=== Управление на моите кандидатури ==='));
  
  if (!currentUser) {
    console.log(chalk.red('❌ Трябва да сте влезли в системата, за да управлявате вашите кандидатури'));
    return null;
  }
  
  try {
    // Извличане на всички кандидатури на потребителя
    console.log(chalk.yellow('Извличане на вашите кандидатури...'));
    
    const appsResponse = await axios.get(`${API_URL}/api/profile/applications`, {
      headers: { Authorization: `Bearer ${currentToken}` },
      timeout: 15000 // 15 секунди таймаут
    });
    
    if (!appsResponse.data.success || !appsResponse.data.data || appsResponse.data.data.length === 0) {
      console.log(chalk.yellow('⚠️ Нямате активни кандидатури'));
      return null;
    }
    
    const applications = appsResponse.data.data;
    console.log(chalk.green(`Намерени ${applications.length} ваши кандидатури`));
    
    // Показване на кандидатурите
    applications.forEach((app, index) => {
      console.log(chalk.cyan(`\n--- Кандидатура #${index + 1} ---`));
      console.log(`Позиция: ${app.job_title}`);
      console.log(`Работодател: ${app.employer_name || 'Неизвестен'} (${app.employer_email || 'Няма имейл'})`);
      console.log(`Статус: ${app.status}`);
      console.log(`Местоположение: ${app.location || 'Не е посочено'}`);
      if (app.salary) console.log(`Заплата: ${app.salary}`);
      console.log(`Дата на кандидатстване: ${new Date(app.created_at).toLocaleString()}`);
      console.log(`Мотивационно писмо: ${app.cover_letter}`);
    });
    
    // Избор на действие
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Изберете действие:',
        choices: [
          { name: 'Редактиране на кандидатура', value: 'edit' },
          { name: 'Изтриване на кандидатура', value: 'delete' },
          { name: 'Назад към главното меню', value: 'back' }
        ]
      }
    ]);
    
    if (action === 'back') {
      return null;
    }
    
    // Избор на кандидатура
    const { applicationId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'applicationId',
        message: 'Изберете кандидатура:',
        choices: applications.map(app => ({
          name: `${app.job_title} - Статус: ${app.status}`,
          value: app.id
        }))
      }
    ]);
    
    const selectedApp = applications.find(app => app.id === applicationId);
    
    if (action === 'edit') {
      // Проверка дали кандидатурата може да бъде редактирана
      if (selectedApp.status !== 'pending') {
        console.log(chalk.yellow('⚠️ Можете да редактирате само кандидатури със статус "В процес"'));
        return null;
      }
      
      // Редактиране на мотивационното писмо
      const { coverLetter } = await inquirer.prompt([
        {
          type: 'editor',
          name: 'coverLetter',
          message: 'Редактирайте вашето мотивационно писмо:',
          default: selectedApp.cover_letter
        }
      ]);
      
      // Изпращане на заявката за обновяване
      console.log(chalk.yellow('Обновяване на кандидатурата...'));
      
      const updateResponse = await axios.put(
        `${API_URL}/api/profile/applications/${applicationId}`,
        { cover_letter: coverLetter },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      
      if (updateResponse.data.success) {
        console.log(chalk.green('✅ Кандидатурата е обновена успешно!'));
        return updateResponse.data.data;
      } else {
        console.log(chalk.red(`❌ Грешка при обновяване: ${updateResponse.data.error}`));
        return null;
      }
    } else if (action === 'delete') {
      // Потвърждение за изтриване
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Сигурни ли сте, че искате да изтриете тази кандидатура?',
          default: false
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('Действието е отменено.'));
        return null;
      }
      
      // Изпращане на заявката за изтриване
      console.log(chalk.yellow('Изтриване на кандидатурата...'));
      
      const deleteResponse = await axios.delete(
        `${API_URL}/api/profile/applications/${applicationId}`,
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      
      if (deleteResponse.data.success) {
        console.log(chalk.green('✅ Кандидатурата е изтрита успешно!'));
        return true;
      } else {
        console.log(chalk.red(`❌ Грешка при изтриване: ${deleteResponse.data.error}`));
        return null;
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Грешка при управление на кандидатури:'), error.message);
    
    if (error.response) {
      console.error('Отговор от сървъра:', error.response.data);
    } else if (error.request) {
      console.error('Проблем със заявката:', error.request);
    }
    
    return null;
  }
};

// Главно меню
const showMainMenu = async () => {
  // Определяме опциите на база дали има влязъл потребител
  const menuChoices = [
    { name: 'Регистрация', value: 'register' },
    { name: 'Вход', value: 'login' }
  ];
  
  // Добавяме опциите, достъпни само за влезли потребители
  if (currentUser) {
    menuChoices.push(
      { name: 'Създаване на обява за работа', value: 'createJob' },
      { name: 'Създаване на обява за екипировка', value: 'createEquipment' },
      { name: 'Кандидатстване за работа', value: 'applyForJob' },
      { name: 'Наемане на екипировка', value: 'rentEquipment' },
      { name: 'Качване на файл', value: 'uploadFile' },
      { name: 'Управление на кандидатури за мои обяви', value: 'manageApplications' },
      { name: 'Управление на моите кандидатури', value: 'manageOwnApplications' },
      { name: 'Изход от профила', value: 'logout' }
    );
  }
  
  // Добавяме опцията за изход от приложението
  menuChoices.push({ name: 'Изход от приложението', value: 'exit' });
  
  // Показваме статус за текущия потребител
  if (currentUser) {
    console.log(chalk.green(`\nВлезли сте като: ${currentUser.username || currentUser.email}`));
  } else {
    console.log(chalk.yellow('\nНе сте влезли в системата'));
  }
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Изберете действие:',
      choices: menuChoices
    }
  ]);

  switch (action) {
    case 'register':
      await register();
      break;
    case 'login':
      await login();
      break;
    case 'createJob':
      await testCreateJob();
      break;
    case 'createEquipment':
      await createEquipment();
      break;
    case 'applyForJob':
      await applyForJob();
      break;
    case 'rentEquipment':
      await testRentEquipment();
      break;
    case 'uploadFile':
      await testUploadFile();
      break;
    case 'manageApplications':
      await manageApplications();
      break;
    case 'manageOwnApplications':
      await manageOwnApplications();
      break;
    case 'logout':
      logout();
      break;
    case 'exit':
      console.log(chalk.blue('Благодарим ви, че използвахте нашето приложение!'));
      return false;
  }

  return true;
};

// Основна функция
const main = async () => {
console.log(chalk.bold.green('========================================'));
console.log(chalk.bold.green('=== Инструмент за тестване на API-то ==='));
console.log(chalk.bold.green('========================================'));
console.log(chalk.yellow('Сървър: ' + API_URL));
console.log(chalk.yellow('Таймаут: ' + TIMEOUT + 'ms'));

let continueRunning = true;
while (continueRunning) {
continueRunning = await showMainMenu();
}
};

// Стартиране на приложението
main().catch(error => {
console.error(chalk.red('Възникна грешка:'));
console.error(error);
process.exit(1);
}); 