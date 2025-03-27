const { pool } = require('../config/db');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Разширено търсене на обяви за работа
// @route   GET /api/search
// @access  Public
exports.advancedSearch = asyncHandler(async (req, res, next) => {
  const {
    keywords,
    location,
    job_type,
    category,
    industry,
    experience_level,
    salary_min,
    salary_max,
    skills,
    company_id,
    page = 1,
    limit = 10
  } = req.query;

  let query = `
    SELECT j.*, c.company_name, c.logo_url
    FROM job_listings j
    INNER JOIN companies c ON j.company_id = c.id
    WHERE j.status = 'active'
  `;

  const params = [];

  // Добавяне на условия към заявката
  if (keywords) {
    query += ` AND (j.title LIKE ? OR j.description LIKE ?)`;
    params.push(`%${keywords}%`, `%${keywords}%`);
  }

  if (location) {
    query += ` AND j.location LIKE ?`;
    params.push(`%${location}%`);
  }

  if (job_type) {
    query += ` AND j.job_type = ?`;
    params.push(job_type);
  }

  if (category) {
    query += ` AND j.category = ?`;
    params.push(category);
  }

  if (industry) {
    query += ` AND j.industry = ?`;
    params.push(industry);
  }

  if (experience_level) {
    query += ` AND j.experience_level = ?`;
    params.push(experience_level);
  }

  if (salary_min) {
    query += ` AND CAST(SUBSTRING_INDEX(j.salary, '-', 1) AS UNSIGNED) >= ?`;
    params.push(parseInt(salary_min));
  }

  if (salary_max) {
    query += ` AND CAST(SUBSTRING_INDEX(j.salary, '-', -1) AS UNSIGNED) <= ?`;
    params.push(parseInt(salary_max));
  }

  if (company_id) {
    query += ` AND j.company_id = ?`;
    params.push(company_id);
  }

  // Умения (ако са подадени)
  if (skills && Array.isArray(skills) && skills.length > 0) {
    query += ` AND j.id IN (
      SELECT job_id FROM job_skills
      WHERE skill_id IN (?)
      GROUP BY job_id
      HAVING COUNT(DISTINCT skill_id) = ?
    )`;
    params.push(skills, skills.length);
  }

  // Брой на резултатите
  const countQuery = `SELECT COUNT(*) as total FROM (${query}) as countTable`;
  const [countResult] = await pool.execute(countQuery, params);
  const total = countResult[0].total;

  // Пагинация
  const offset = (page - 1) * limit;
  query += ` ORDER BY j.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  // Изпълнение на заявката
  const [jobs] = await pool.execute(query, params);

  // Добавяне на уменията към всяка обява
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
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    data: jobs
  });
});

// @desc    Получаване на популярни търсения
// @route   GET /api/search/popular
// @access  Public
exports.getPopularSearches = asyncHandler(async (req, res, next) => {
  // Получаване на популярни индустрии
  const [industries] = await pool.execute(`
    SELECT j.industry, COUNT(*) as count
    FROM job_listings j
    WHERE j.status = 'active' AND j.industry IS NOT NULL
    GROUP BY j.industry
    ORDER BY count DESC
    LIMIT 5
  `);

  // Получаване на популярни локации
  const [locations] = await pool.execute(`
    SELECT j.location, COUNT(*) as count
    FROM job_listings j
    WHERE j.status = 'active' AND j.location IS NOT NULL
    GROUP BY j.location
    ORDER BY count DESC
    LIMIT 5
  `);

  // Получаване на популярни умения
  const [skills] = await pool.execute(`
    SELECT s.id, s.name, COUNT(*) as count
    FROM skills s
    INNER JOIN job_skills js ON s.id = js.skill_id
    INNER JOIN job_listings j ON js.job_id = j.id
    WHERE j.status = 'active'
    GROUP BY s.id, s.name
    ORDER BY count DESC
    LIMIT 10
  `);

  res.status(200).json({
    success: true,
    data: {
      industries,
      locations,
      skills
    }
  });
}); 