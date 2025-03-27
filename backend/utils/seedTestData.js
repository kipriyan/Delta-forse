const { pool } = require('../config/db');

// Функция за добавяне на тестови обяви за работа
const seedJobListings = async () => {
  try {
    console.log('Започва добавяне на тестови обяви за работа...');
    
    // Взимаме списък с потребители, за да използваме валидни user_id
    const [users] = await pool.query('SELECT id FROM users LIMIT 1');
    
    if (!users || users.length === 0) {
      console.log('Няма потребители в базата данни. Първо добавете потребител.');
      return;
    }
    
    const userId = users[0].id;
    
    // Тестови обяви за работа
    const testJobs = [
      {
        title: 'JavaScript разработчик',
        description: 'Търсим опитен JavaScript разработчик за работа по наш нов проект.',
        requirements: 'Опит с React, Node.js и Express',
        benefits: 'Гъвкаво работно време, допълнителна здравна осигуровка',
        location: 'София',
        salary: '3000-4000',
        job_type: 'full-time',
        category: 'IT',
        industry: 'Софтуер'
      },
      {
        title: 'PHP разработчик',
        description: 'Търсим PHP разработчик със солиден опит в Laravel.',
        requirements: 'Минимум 2 години опит с PHP и Laravel',
        benefits: 'Работа от вкъщи, бонуси за постижения',
        location: 'Пловдив',
        salary: '2500-3500',
        job_type: 'full-time',
        category: 'IT',
        industry: 'Софтуер'
      },
      {
        title: 'Мениджър продажби',
        description: 'Търсим амбициозен мениджър продажби за разширяване на нашия екип.',
        requirements: 'Опит в продажбите и управлението на екип',
        benefits: 'Атрактивна система за бонуси',
        location: 'София',
        salary: '2800-3800',
        job_type: 'full-time',
        category: 'Продажби',
        industry: 'Търговия'
      },
      {
        title: 'Графичен дизайнер',
        description: 'Търсим креативен графичен дизайнер за нашата маркетинг агенция.',
        requirements: 'Опит с Adobe Creative Suite и добро портфолио',
        benefits: 'Млад и динамичен екип, творческа свобода',
        location: 'Варна',
        salary: '2200-3000',
        job_type: 'part-time',
        category: 'Дизайн',
        industry: 'Маркетинг'
      },
      {
        title: 'DevOps инженер',
        description: 'Търсим DevOps инженер за поддръжка на нашата облачна инфраструктура.',
        requirements: 'Опит с AWS, Docker, Kubernetes',
        benefits: 'Конкурентно заплащане, възможност за обучения',
        location: 'Дистанционна работа',
        salary: '4000-5500',
        job_type: 'full-time',
        category: 'IT',
        industry: 'Софтуер'
      }
    ];
    
    // Добавяне на всяка обява в базата данни
    for (const job of testJobs) {
      await pool.execute(
        `INSERT INTO job_listings 
         (title, description, requirements, benefits, location, salary, job_type, category, industry, user_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
        [
          job.title,
          job.description,
          job.requirements,
          job.benefits,
          job.location,
          job.salary,
          job.job_type,
          job.category,
          job.industry,
          userId
        ]
      );
      
      console.log(`Добавена обява: ${job.title}`);
    }
    
    console.log('Тестовите обяви са добавени успешно!');
  } catch (error) {
    console.error('Грешка при добавяне на тестови обяви:', error);
  } finally {
    // Затваряме връзката с базата данни
    process.exit(0);
  }
};

// Изпълняваме функцията
seedJobListings(); 