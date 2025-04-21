const { pool } = require('../config/db');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const JobListing = require('../models/JobListing');

// @desc    Запазване на обява в "Любими"
// @route   POST /api/saved-jobs
// @access  Private
exports.saveJob = asyncHandler(async (req, res, next) => {
  const { job_id } = req.body;

  // Проверка дали обявата съществува използвайки SQL заявка вместо JobListing модел
  const [jobResult] = await pool.execute(
    'SELECT * FROM job_listings WHERE id = ?',
    [job_id]
  );

  if (!jobResult || jobResult.length === 0) {
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
  try {
    // Извличане на запазените обяви с опростена заявка
    const [savedJobs] = await pool.execute(`
      SELECT sj.id as saved_id, sj.job_id, sj.created_at as saved_at,
             j.id, j.title, j.description, j.location, j.salary, j.job_type, j.company_id
      FROM saved_jobs sj
      JOIN job_listings j ON sj.job_id = j.id
      WHERE sj.user_id = ?
      ORDER BY sj.created_at DESC
    `, [req.user.id]);

    // Ако няма запазени обяви, връщаме празен масив
    if (!savedJobs || savedJobs.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Форматираме отговора
    const formattedJobs = savedJobs.map(job => ({
      id: job.id,
      job_id: job.job_id,
      saved_id: job.saved_id,
      title: job.title || 'Няма заглавие',
      location: job.location || 'Няма локация',
      salary: job.salary || 'По договаряне',
      job_type: job.job_type || 'Пълен работен ден',
      description: job.description || 'Няма описание',
      saved_at: job.saved_at
    }));

    res.status(200).json({
      success: true,
      count: formattedJobs.length,
      data: formattedJobs
    });
  } catch (error) {
    console.error('Error getting saved jobs:', error);
    return next(new ErrorResponse('Грешка при извличане на запазените обяви', 500));
  }
}); 