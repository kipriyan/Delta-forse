const JobListing = require('../models/JobListing');
const JobApplication = require('../models/JobApplication');
const Company = require('../models/Company');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const { pool } = require('../config/db');
const SavedJob = require('../models/SavedJob');

// @desc    Получаване на всички обяви за работа с пагинация и филтриране
// @route   GET /api/jobs
// @access  Public
exports.getAllJobs = asyncHandler(async (req, res, next) => {
  // Извличане на параметрите за филтриране от заявката
  const {
    page = 1,
    limit = 10,
    title,
    location,
    job_type,
    category,
    industry,
    company_id,
    status = 'active'
  } = req.query;

  // Създаване на обект с филтрите
  const filters = {
    title,
    location,
    job_type,
    category,
    industry,
    company_id,
    status
  };

  // Филтриране само по валидни филтри (не undefined)
  Object.keys(filters).forEach(key => {
    if (filters[key] === undefined) {
      delete filters[key];
    }
  });

  // Получаване на обявите от базата данни
  const result = await JobListing.findAll(page, limit, filters);

  res.status(200).json({
    success: true,
    count: result.jobs.length,
    pagination: result.pagination,
    data: result.jobs
  });
});

// @desc    Получаване на една обява за работа по ID
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = asyncHandler(async (req, res, next) => {
  const job = await JobListing.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse(`Не е намерена обява с ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: job
  });
});

// @desc    Създаване на нова обява за работа
// @route   POST /api/jobs
// @access  Private
exports.createJob = asyncHandler(async (req, res, next) => {
  // Добавяме потребителя към заявката
  req.body.user_id = req.user.id;
  req.body.status = 'active';
  
  const { title, description, location, job_type, salary, requirements, user_id, status } = req.body;
  
  const [result] = await pool.execute(
    `INSERT INTO job_listings (title, description, location, job_type, salary, requirements, user_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [title, description, location, job_type, salary, requirements || null, user_id, status]
  );
  
  // Взимане на създадената обява
  const [jobs] = await pool.execute(
    'SELECT * FROM job_listings WHERE id = ?',
    [result.insertId]
  );
  
  res.status(201).json({
    success: true,
    data: jobs[0]
  });
});

// @desc    Обновяване на обява за работа
// @route   PUT /api/jobs/:id
// @access  Private (само за собственика на обявата или админи)
exports.updateJob = asyncHandler(async (req, res, next) => {
  // Намиране на обявата
  const job = await JobListing.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse(`Не е намерена обява с ID ${req.params.id}`, 404));
  }

  // Проверка за права (само собственикът на обявата или админи могат да я обновят)
  if (job.user_id !== req.user.id && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Нямате права да редактирате тази обява', 403));
  }

  // Валидиране на данните за обявата, ако се опитваме да обновим важни полета
  if (req.body.title || req.body.description || req.body.location || req.body.job_type) {
    const { isValid, errors } = validateJobListing({
      ...job,
      ...req.body
    });

    if (!isValid) {
      return next(new ErrorResponse(errors.join(', '), 400));
    }
  }

  // Обновяване на обявата
  const updatedJob = await JobListing.update(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: updatedJob
  });
});

// @desc    Изтриване на обява за работа
// @route   DELETE /api/jobs/:id
// @access  Private (само за собственика на обявата или админи)
exports.deleteJob = asyncHandler(async (req, res, next) => {
  // Намиране на обявата
  const job = await JobListing.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse(`Не е намерена обява с ID ${req.params.id}`, 404));
  }

  // Проверка за права (само собственикът на обявата или админи могат да я изтрият)
  if (job.user_id !== req.user.id && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Нямате права да изтриете тази обява', 403));
  }

  // Изтриване на обявата
  await JobListing.delete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Получаване на всички обяви за работа, създадени от текущия потребител
// @route   GET /api/jobs/my
// @access  Private
exports.getMyJobs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await JobListing.findByUserId(req.user.id, page, limit);

  res.status(200).json({
    success: true,
    count: result.jobs.length,
    pagination: result.pagination,
    data: result.jobs
  });
});

// @desc    Получаване на всички обяви за работа за определена компания
// @route   GET /api/jobs/company/:companyId
// @access  Public
exports.getCompanyJobs = asyncHandler(async (req, res, next) => {
  const companyId = req.params.companyId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Проверка дали компанията съществува
  const [company] = await pool.execute(
    'SELECT * FROM companies WHERE id = ?',
    [companyId]
  );

  if (company.length === 0) {
    return next(new ErrorResponse(`Не е намерена компания с ID ${companyId}`, 404));
  }

  const result = await JobListing.findByCompanyId(companyId, page, limit);

  res.status(200).json({
    success: true,
    count: result.jobs.length,
    pagination: result.pagination,
    data: result.jobs
  });
});

// @desc    Промяна на статуса на обява за работа
// @route   PUT /api/jobs/:id/status
// @access  Private (само за собственика на обявата или админи)
exports.updateJobStatus = asyncHandler(async (req, res, next) => {
  // Намиране на обявата
  const job = await JobListing.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse(`Не е намерена обява с ID ${req.params.id}`, 404));
  }

  // Проверка за права (само собственикът на обявата или админи могат да променят статуса)
  if (job.user_id !== req.user.id && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Нямате права да променяте статуса на тази обява', 403));
  }

  // Проверка за валиден статус
  const { status } = req.body;
  if (!status || !['active', 'closed', 'draft'].includes(status)) {
    return next(new ErrorResponse('Невалиден статус. Разрешени стойности: active, closed, draft', 400));
  }

  // Обновяване на статуса на обявата
  const updatedJob = await JobListing.update(req.params.id, { status });

  res.status(200).json({
    success: true,
    data: updatedJob
  });
});

// @desc    Търсене на обяви за работа
// @route   GET /api/jobs/search
// @access  Public
exports.searchJobs = asyncHandler(async (req, res, next) => {
  const searchTerm = req.query.q;
  
  if (!searchTerm) {
    return next(new ErrorResponse('Моля, въведете търсене', 400));
  }

  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  const jobs = await JobListing.search(searchTerm, limit, offset);
  
  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

// @desc    Филтриране на обяви за работа
// @route   GET /api/jobs/filter
// @access  Public
exports.filterJobs = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  // Филтри
  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.job_type) filters.job_type = req.query.job_type;
  if (req.query.category) filters.category = req.query.category;
  if (req.query.location) filters.location = req.query.location;

  const jobs = await JobListing.findAll(limit, offset, filters);
  
  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

// @desc    Кандидатстване за работа
// @route   POST /api/jobs/:id/apply
// @access  Private
exports.applyForJob = asyncHandler(async (req, res) => {
  console.log('applyForJob: Започва изпълнение');
  const jobId = req.params.id;
  const userId = req.user.id;
  
  console.log(`Кандидатстване за обява ${jobId} от потребител ${userId}`);
  
  try {
    // Проверяваме дали обявата съществува
    const [job] = await pool.query('SELECT * FROM job_listings WHERE id = ?', [jobId]);
    
    if (!job || job.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Обявата за работа не е намерена'
      });
    }
    
    // Проверяваме дали потребителят вече е кандидатствал
    const [existingApplications] = await pool.query(
      'SELECT * FROM job_applications WHERE job_id = ? AND user_id = ?',
      [jobId, userId]
    );
    
    if (existingApplications && existingApplications.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Вече сте кандидатствали за тази позиция'
      });
    }
    
    // Взимаме данните от заявката
    const { cover_letter, resume_url = null } = req.body;
    
    // Проверка за качен файл (ако имплементирате качване на файлове)
    let resume_file = null;
    if (req.file) {
      resume_file = req.file.filename;
    }
    
    // Връщаме колоните resume_url и resume_file в заявката
    const [result] = await pool.execute(
      `INSERT INTO job_applications (job_id, user_id, cover_letter, resume_url, resume_file, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [jobId, userId, cover_letter, resume_url, resume_file]
    );
    
    if (result.affectedRows > 0) {
      res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          job_id: jobId,
          user_id: userId,
          cover_letter,
          resume_url,
          resume_file,
          status: 'pending'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Неуспешно кандидатстване'
      });
    }
  } catch (error) {
    console.error('ERROR в applyForJob:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Грешка при кандидатстването'
    });
  }
});

// @desc    Преглед на кандидатурите за конкретна обява
// @route   GET /api/jobs/:id/applications
// @access  Private
exports.getJobApplications = asyncHandler(async (req, res) => {
  const jobId = req.params.id;
  const userId = req.user.id;
  
  console.log(`Преглед на кандидатури за обява ${jobId} от потребител ${userId}`);
  
  try {
    // Проверяваме дали обявата съществува и принадлежи на текущия потребител
    const [job] = await pool.query(
      'SELECT * FROM job_listings WHERE id = ? AND user_id = ?',
      [jobId, userId]
    );
    
    if (!job || job.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Обявата не е намерена или нямате права за нея'
      });
    }
    
    // Извличаме всички кандидатури за тази обява
    // Променяме заявката, за да използваме съществуващите колони в таблицата users
    const [applications] = await pool.query(`
      SELECT a.*, u.email, u.username 
      FROM job_applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.job_id = ?
      ORDER BY a.created_at DESC
    `, [jobId]);
    
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('ERROR в getJobApplications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Грешка при извличане на кандидатурите'
    });
  }
});

// @desc    Получаване на всички мои кандидатури (за потребители)
// @route   GET /api/jobs/applications/my
// @access  Private
exports.getMyApplications = asyncHandler(async (req, res, next) => {
  const applications = await JobApplication.getApplicationsWithJobDetails(req.user.id);

  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
});

// @desc    Промяна на статуса на кандидатура (приемане/отхвърляне)
// @route   PUT /api/jobs/applications/:id
// @access  Private
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const applicationId = req.params.id;
  const userId = req.user.id;
  const { status } = req.body;
  
  // Проверка на допустимите стойности според базата данни
  const allowedStatuses = ['pending', 'approved', 'rejected'];
  
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Невалиден статус. Позволени стойности: ${allowedStatuses.join(', ')}`
    });
  }
  
  try {
    // Проверяваме дали кандидатурата съществува и дали потребителят има права
    const [application] = await pool.query(`
      SELECT a.*, j.user_id as job_owner_id
      FROM job_applications a
      JOIN job_listings j ON a.job_id = j.id
      WHERE a.id = ?
    `, [applicationId]);
    
    if (!application || application.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Кандидатурата не е намерена'
      });
    }
    
    // Проверяваме дали потребителят е собственик на обявата
    if (application[0].job_owner_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Нямате право да управлявате тази кандидатура'
      });
    }
    
    // Актуализираме статуса
    const [result] = await pool.execute(
      'UPDATE job_applications SET status = ? WHERE id = ?',
      [status, applicationId]
    );
    
    if (result.affectedRows > 0) {
      // Връщаме обновената кандидатура
      const [updatedApp] = await pool.query(`
        SELECT a.*, u.email, u.username 
        FROM job_applications a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = ?
      `, [applicationId]);
      
      res.status(200).json({
        success: true,
        data: updatedApp[0]
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Неуспешна актуализация на кандидатурата'
      });
    }
  } catch (error) {
    console.error('ERROR в updateApplicationStatus:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Грешка при актуализиране на кандидатурата'
    });
  }
});

// @desc    Изтриване на кандидатура
// @route   DELETE /api/jobs/applications/:id
// @access  Private (само за собственика на кандидатурата, собственика на обявата или админ)
exports.deleteApplication = asyncHandler(async (req, res, next) => {
  const application = await JobApplication.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Не е намерена кандидатура с ID ${req.params.id}`, 404));
  }

  const job = await JobListing.findById(application.job_id);

  // Проверка дали потребителят е собственик на кандидатурата или собственик на обявата
  if (application.user_id !== req.user.id && job.user_id !== req.user.id && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Нямате права да изтривате тази кандидатура', 403));
  }

  await JobApplication.delete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Запазване на обява за работа от потребител
// @route   POST /api/jobs/:id/save
// @access  Private
exports.saveJob = asyncHandler(async (req, res, next) => {
  const job = await JobListing.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse(`Не е намерена обява с ID ${req.params.id}`, 404));
  }

  // Проверка дали потребителят вече е запазил тази обява
  const existingSavedJob = await SavedJob.findByUserAndJob(req.user.id, req.params.id);
  if (existingSavedJob) {
    return next(new ErrorResponse('Тази обява вече е запазена', 400));
  }

  // Създаване на запазена обява
  const savedJob = await SavedJob.create({
    user_id: req.user.id,
    job_id: req.params.id
  });

  res.status(201).json({
    success: true,
    data: savedJob
  });
});

// @desc    Премахване на запазена обява за работа
// @route   DELETE /api/jobs/:id/save
// @access  Private
exports.unsaveJob = asyncHandler(async (req, res, next) => {
  const job = await JobListing.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse(`Не е намерена обява с ID ${req.params.id}`, 404));
  }

  // Проверка дали потребителят е запазил тази обява
  const existingSavedJob = await SavedJob.findByUserAndJob(req.user.id, req.params.id);
  if (!existingSavedJob) {
    return next(new ErrorResponse('Тази обява не е запазена', 400));
  }

  // Изтриване на запазената обява
  await SavedJob.deleteByUserAndJob(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Получаване на всички запазени обяви за работа за потребителя
// @route   GET /api/jobs/saved
// @access  Private
exports.getSavedJobs = asyncHandler(async (req, res, next) => {
  const savedJobs = await SavedJob.findByUserId(req.user.id);

  res.status(200).json({
    success: true,
    count: savedJobs.length,
    data: savedJobs
  });
});

// @desc    Разширено търсене на обяви за работа
// @route   GET /api/jobs/advanced-search
// @access  Public
exports.advancedSearch = asyncHandler(async (req, res, next) => {
  // Извличане на параметрите за търсене от заявката
  const {
    keywords,
    location,
    jobType,
    category,
    industry,
    salary_min,
    salary_max,
    experience_level,
    education_level,
    skills,
    company_id
  } = req.query;

  // Базова заявка за избиране на обяви за работа
  let query = `
    SELECT j.*, c.company_name, c.logo_url
    FROM job_listings j
    INNER JOIN companies c ON j.company_id = c.id
    WHERE j.status = 'active'
  `;

  // Параметри за заявката
  const params = [];

  // Добавяне на условия към заявката в зависимост от подадените параметри
  if (keywords) {
    query += ` AND (j.title LIKE ? OR j.description LIKE ?)`;
    params.push(`%${keywords}%`, `%${keywords}%`);
  }

  if (location) {
    query += ` AND j.location LIKE ?`;
    params.push(`%${location}%`);
  }

  if (jobType) {
    query += ` AND j.job_type = ?`;
    params.push(jobType);
  }

  if (category) {
    query += ` AND j.category = ?`;
    params.push(category);
  }

  if (industry) {
    query += ` AND j.industry = ?`;
    params.push(industry);
  }

  if (salary_min) {
    query += ` AND CAST(SUBSTRING_INDEX(j.salary, '-', 1) AS UNSIGNED) >= ?`;
    params.push(salary_min);
  }

  if (salary_max) {
    query += ` AND CAST(SUBSTRING_INDEX(j.salary, '-', -1) AS UNSIGNED) <= ?`;
    params.push(salary_max);
  }

  if (experience_level) {
    query += ` AND j.experience_level = ?`;
    params.push(experience_level);
  }

  if (education_level) {
    query += ` AND j.education_level = ?`;
    params.push(education_level);
  }

  if (company_id) {
    query += ` AND j.company_id = ?`;
    params.push(company_id);
  }

  // Ако има посочени умения, добавяме JOIN с job_skills таблицата
  if (skills && Array.isArray(skills) && skills.length > 0) {
    query += `
      AND j.id IN (
        SELECT job_id 
        FROM job_skills 
        WHERE skill_id IN (?) 
        GROUP BY job_id
        HAVING COUNT(DISTINCT skill_id) = ?
      )
    `;
    params.push(skills, skills.length);
  }

  // Добавяне на сортиране по дата - най-новите първи
  query += ` ORDER BY j.created_at DESC`;

  // Изпълнение на заявката
  const [jobs] = await pool.execute(query, params);

  // Добавяне на умения към всяка обява за работа
  for (let job of jobs) {
    const [skills] = await pool.execute(`
      SELECT s.id, s.name
      FROM skills s
      INNER JOIN job_skills js ON s.id = js.skill_id
      WHERE js.job_id = ?
    `, [job.id]);
    
    job.skills = skills;
  }

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

// @desc    Получаване на възможни стойности за филтри
// @route   GET /api/jobs/filter-options
// @access  Public
exports.getFilterOptions = asyncHandler(async (req, res, next) => {
  // Получаване на всички категории
  const [categories] = await pool.execute(`
    SELECT DISTINCT category FROM job_listings WHERE category IS NOT NULL
  `);

  // Получаване на всички индустрии
  const [industries] = await pool.execute(`
    SELECT DISTINCT industry FROM job_listings WHERE industry IS NOT NULL
  `);

  // Получаване на всички локации
  const [locations] = await pool.execute(`
    SELECT DISTINCT location FROM job_listings WHERE location IS NOT NULL
  `);

  // Получаване на всички типове работа
  const [jobTypes] = await pool.execute(`
    SELECT DISTINCT job_type FROM job_listings WHERE job_type IS NOT NULL
  `);

  // Получаване на всички умения
  const [skills] = await pool.execute(`
    SELECT * FROM skills ORDER BY name ASC
  `);

  // Получаване на всички нива на опит
  const [experienceLevels] = await pool.execute(`
    SELECT DISTINCT experience_level FROM job_listings WHERE experience_level IS NOT NULL
  `);

  // Получаване на всички нива на образование
  const [educationLevels] = await pool.execute(`
    SELECT DISTINCT education_level FROM job_listings WHERE education_level IS NOT NULL
  `);

  res.status(200).json({
    success: true,
    data: {
      categories: categories.map(item => item.category),
      industries: industries.map(item => item.industry),
      locations: locations.map(item => item.location),
      job_types: jobTypes.map(item => item.job_type),
      skills,
      experience_levels: experienceLevels.map(item => item.experience_level),
      education_levels: educationLevels.map(item => item.education_level)
    }
  });
});

// @desc    Вземане на всички обяви за работа
// @route   GET /api/jobs
// @access  Public
exports.getJobs = asyncHandler(async (req, res) => {
  console.log('-------------------------');
  console.log('getJobs метод извикан');
  
  try {
    // Извличаме данните от базата директно
    const connection = await pool.getConnection();
    console.log('Връзка с базата получена');
    
    const [rows] = await connection.query('SELECT * FROM job_listings LIMIT 10');
    connection.release();
    
    // Отпечатваме за дебъгване
    console.log('Запитването върна:', typeof rows, rows ? 'с данни' : 'undefined');
    if (rows) {
      console.log('Тип на rows.length:', typeof rows.length);
      console.log('Стойност на rows.length:', rows.length);
    }
    
    // Изграждаме отговора, като избягваме изцяло достъпването на .length
    let response = {
      success: true,
      data: []
    };
    
    // Проверяваме дали rows съществува и е масив
    if (rows && Array.isArray(rows)) {
      response.data = rows;
    }
    
    console.log('Изпращане на отговор');
    return res.status(200).json(response);
  } catch (error) {
    console.error('Грешка в getJobs:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Неизвестна грешка'
    });
  }
}); 