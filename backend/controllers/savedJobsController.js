const { pool } = require('../config/db');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const JobListing = require('../models/JobListing');

// @desc    Запазване на обява в "Любими"
// @route   POST /api/saved-jobs
// @access  Private
exports.saveJob = asyncHandler(async (req, res, next) => {
  const { job_id } = req.body;

  // Проверка дали обявата съществува
  const job = await JobListing.findById(job_id);
  if (!job) {
    return next(new ErrorResponse(`Не е намерена обява с ID ${job_id}`, 404));
  }

  // Проверка дали обявата вече е запазена
  const [existingSaved] = await pool.execute(
    'SELECT * FROM saved_jobs WHERE user_id = ? AND job_id = ?',
    [req.user.id, job_id]
  );

  if (existingSaved.length > 0) {
    return next(new ErrorResponse('Тази обява вече е запазена', 400));
  }

  // Запазване на обявата
  await pool.execute(
    'INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)',
    [req.user.id, job_id]
  );

  res.status(201).json({
    success: true,
    data: { job_id }
  });
});

// @desc    Премахване на обява от "Любими"
// @route   DELETE /api/saved-jobs/:job_id
// @access  Private
exports.unsaveJob = asyncHandler(async (req, res, next) => {
  const { job_id } = req.params;

  // Проверка дали обявата е запазена
  const [existingSaved] = await pool.execute(
    'SELECT * FROM saved_jobs WHERE user_id = ? AND job_id = ?',
    [req.user.id, job_id]
  );

  if (existingSaved.length === 0) {
    return next(new ErrorResponse('Тази обява не е запазена', 404));
  }

  // Премахване на обявата от "Любими"
  await pool.execute(
    'DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?',
    [req.user.id, job_id]
  );

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Получаване на всички запазени обяви
// @route   GET /api/saved-jobs
// @access  Private
exports.getSavedJobs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Получаване на общия брой запазени обяви
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) as total FROM saved_jobs WHERE user_id = ?',
    [req.user.id]
  );
  const total = countResult[0].total;

  // Получаване на запазените обяви с детайли
  const [savedJobs] = await pool.execute(`
    SELECT j.*, c.company_name, c.logo_url, sj.created_at as saved_at
    FROM saved_jobs sj
    INNER JOIN job_listings j ON sj.job_id = j.id
    INNER JOIN companies c ON j.company_id = c.id
    WHERE sj.user_id = ?
    ORDER BY sj.created_at DESC
    LIMIT ? OFFSET ?
  `, [req.user.id, limit, offset]);

  // Добавяне на уменията към всяка обява
  for (let job of savedJobs) {
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
    count: savedJobs.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: savedJobs
  });
}); 