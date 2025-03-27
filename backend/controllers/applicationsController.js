const { pool } = require('../config/db');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const JobListing = require('../models/JobListing');

// @desc    Кандидатстване за работа
// @route   POST /api/applications
// @access  Private
exports.applyForJob = asyncHandler(async (req, res, next) => {
  const { job_id, cover_letter, resume_url, resume_file } = req.body;

  // Проверка дали обявата съществува
  const job = await JobListing.findById(job_id);
  if (!job) {
    return next(new ErrorResponse(`Не е намерена обява с ID ${job_id}`, 404));
  }

  // Проверка дали обявата е активна
  if (job.status !== 'active') {
    return next(new ErrorResponse('Не можете да кандидатствате за неактивна обява', 400));
  }

  // Проверка дали потребителят вече е кандидатствал
  const [existingApplication] = await pool.execute(
    'SELECT * FROM job_applications WHERE user_id = ? AND job_id = ?',
    [req.user.id, job_id]
  );

  if (existingApplication.length > 0) {
    return next(new ErrorResponse('Вече сте кандидатствали за тази позиция', 400));
  }

  // Проверка за наличие на CV (или като URL, или като файл)
  if (!resume_url && !resume_file) {
    return next(new ErrorResponse('Моля, предоставете CV като URL или качете файл', 400));
  }

  // Създаване на кандидатурата
  const [result] = await pool.execute(
    `INSERT INTO job_applications 
      (job_id, user_id, company_id, cover_letter, resume_url, resume_file, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      job_id, 
      req.user.id, 
      job.company_id, 
      cover_letter || null,
      resume_url || null,
      resume_file || null,
      'pending'
    ]
  );

  // Увеличаване на броя на кандидатурите за обявата
  await pool.execute(
    'UPDATE job_listings SET applications = applications + 1 WHERE id = ?',
    [job_id]
  );

  // Получаване на създадената кандидатура с допълнителна информация
  const [application] = await pool.execute(`
    SELECT ja.*, j.title AS job_title, c.company_name, 
           CONCAT(u.first_name, ' ', u.last_name) AS applicant_name
    FROM job_applications ja
    INNER JOIN job_listings j ON ja.job_id = j.id
    INNER JOIN companies c ON ja.company_id = c.id
    INNER JOIN users u ON ja.user_id = u.id
    WHERE ja.id = ?
  `, [result.insertId]);

  res.status(201).json({
    success: true,
    data: application[0]
  });
});

// @desc    Получаване на кандидатурите на потребителя
// @route   GET /api/applications
// @access  Private
exports.getMyApplications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Получаване на общия брой кандидатури
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) as total FROM job_applications WHERE user_id = ?',
    [req.user.id]
  );
  const total = countResult[0].total;

  // Получаване на кандидатурите с детайли
  const [applications] = await pool.execute(`
    SELECT ja.*, j.title as job_title, j.location, j.job_type, c.company_name, c.logo_url
    FROM job_applications ja
    INNER JOIN job_listings j ON ja.job_id = j.id
    INNER JOIN companies c ON ja.company_id = c.id
    WHERE ja.user_id = ?
    ORDER BY ja.created_at DESC
    LIMIT ? OFFSET ?
  `, [req.user.id, limit, offset]);

  res.status(200).json({
    success: true,
    count: applications.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: applications
  });
});

// @desc    Получаване на кандидатури за обява
// @route   GET /api/applications/job/:job_id
// @access  Private (само за компанията, която е публикувала обявата)
exports.getJobApplications = asyncHandler(async (req, res, next) => {
  const { job_id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Проверка дали обявата съществува
  const job = await JobListing.findById(job_id);
  if (!job) {
    return next(new ErrorResponse(`Не е намерена обява с ID ${job_id}`, 404));
  }

  // Проверка за права (само компанията, която е публикувала обявата или админи)
  if (job.user_id !== req.user.id && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Нямате права да видите кандидатурите за тази обява', 403));
  }

  // Получаване на общия брой кандидатури
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) as total FROM job_applications WHERE job_id = ?',
    [job_id]
  );
  const total = countResult[0].total;

  // Получаване на кандидатурите с детайли
  const [applications] = await pool.execute(`
    SELECT ja.*, u.username, u.email, u.first_name, u.last_name, u.profile_image
    FROM job_applications ja
    INNER JOIN users u ON ja.user_id = u.id
    WHERE ja.job_id = ?
    ORDER BY ja.created_at DESC
    LIMIT ? OFFSET ?
  `, [job_id, limit, offset]);

  res.status(200).json({
    success: true,
    count: applications.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: applications
  });
});

// @desc    Актуализиране на кандидатура
// @route   PUT /api/applications/:id
// @access  Private (потребителят за своята кандидатура или компанията за промяна на статус)
exports.updateApplication = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Получаване на кандидатурата
  const [application] = await pool.execute(
    'SELECT * FROM job_applications WHERE id = ?',
    [id]
  );

  if (application.length === 0) {
    return next(new ErrorResponse(`Не е намерена кандидатура с ID ${id}`, 404));
  }

  const currentApplication = application[0];

  // Проверка на правата
  const isCompany = req.user.id === currentApplication.company_id || req.user.user_type === 'admin';
  const isApplicant = req.user.id === currentApplication.user_id;

  if (!isCompany && !isApplicant) {
    return next(new ErrorResponse('Нямате права да актуализирате тази кандидатура', 403));
  }

  // Ако е компания, може да променя само статуса
  if (isCompany) {
    const { status } = req.body;
    if (!status || !['pending', 'reviewed', 'interview', 'rejected', 'accepted'].includes(status)) {
      return next(new ErrorResponse('Невалиден статус', 400));
    }

    await pool.execute(
      'UPDATE job_applications SET status = ? WHERE id = ?',
      [status, id]
    );
  } 
  // Ако е кандидат, може да променя само съпроводителното писмо и резюмето
  else if (isApplicant) {
    const { cover_letter, resume_url } = req.body;
    
    await pool.execute(
      'UPDATE job_applications SET cover_letter = ?, resume_url = ? WHERE id = ?',
      [
        cover_letter || currentApplication.cover_letter,
        resume_url || currentApplication.resume_url,
        id
      ]
    );
  }

  // Получаване на актуализираната кандидатура
  const [updatedApplication] = await pool.execute(`
    SELECT ja.*, j.title as job_title, c.company_name
    FROM job_applications ja
    INNER JOIN job_listings j ON ja.job_id = j.id
    INNER JOIN companies c ON ja.company_id = c.id
    WHERE ja.id = ?
  `, [id]);

  res.status(200).json({
    success: true,
    data: updatedApplication[0]
  });
});

// @desc    Изтриване на кандидатура
// @route   DELETE /api/applications/:id
// @access  Private (само потребителят, който е подал кандидатурата)
exports.deleteApplication = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Получаване на кандидатурата
  const [application] = await pool.execute(
    'SELECT * FROM job_applications WHERE id = ?',
    [id]
  );

  if (application.length === 0) {
    return next(new ErrorResponse(`Не е намерена кандидатура с ID ${id}`, 404));
  }

  // Проверка за права (само потребителят, който е подал кандидатурата)
  if (application[0].user_id !== req.user.id && req.user.user_type !== 'admin') {
    return next(new ErrorResponse('Нямате права да изтриете тази кандидатура', 403));
  }

  // Намаляване на броя на кандидатурите за обявата
  await pool.execute(
    'UPDATE job_listings SET applications = GREATEST(applications - 1, 0) WHERE id = ?',
    [application[0].job_id]
  );

  // Изтриване на кандидатурата
  await pool.execute(
    'DELETE FROM job_applications WHERE id = ?',
    [id]
  );

  res.status(200).json({
    success: true,
    data: {}
  });
}); 