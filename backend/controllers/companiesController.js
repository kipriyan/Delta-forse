const pool = require('../config/db');
const Company = require('../models/Company');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const JobListing = require('../models/JobListing');

const companiesController = {
  // Получаване на всички компании
  getAllCompanies: asyncHandler(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const companies = await Company.findAll(limit, offset);
    
    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  }),

  // Получаване на конкретна компания
  getCompanyById: asyncHandler(async (req, res, next) => {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return next(new ErrorResponse(`Не е намерена компания с ID ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: company
    });
  }),

  // Получаване на обявите на компания
  getCompanyJobs: async (req, res) => {
    try {
      const [jobs] = await pool.query(`
        SELECT j.*, COUNT(ja.id) as applications_count
        FROM job_listings j
        LEFT JOIN job_applications ja ON j.id = ja.job_id
        WHERE j.company_id = ? AND j.status = 'active'
        GROUP BY j.id
        ORDER BY j.created_at DESC
      `, [req.params.id]);

      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: 'Грешка при зареждане на обявите' });
    }
  },

  // Създаване на компания
  createCompany: asyncHandler(async (req, res, next) => {
    // Проверка дали потребителят е от тип company
    if (req.user.user_type !== 'company') {
      return next(new ErrorResponse('Само потребители от тип company могат да създават компании', 403));
    }

    // Проверка дали потребителят вече има създадена компания
    const existingCompany = await Company.findByUserId(req.user.id);
    if (existingCompany) {
      return next(new ErrorResponse('Потребителят вече има създадена компания', 400));
    }

    // Добавяне на user_id към данните за компания
    req.body.user_id = req.user.id;

    const company = await Company.create(req.body);

    res.status(201).json({
      success: true,
      data: company
    });
  }),

  // Обновяване на компания
  updateCompany: asyncHandler(async (req, res, next) => {
    let company = await Company.findById(req.params.id);

    if (!company) {
      return next(new ErrorResponse(`Не е намерена компания с ID ${req.params.id}`, 404));
    }

    // Проверка дали потребителят е собственик на компанията
    if (company.user_id !== req.user.id && req.user.user_type !== 'admin') {
      return next(new ErrorResponse('Нямате права да обновявате тази компания', 403));
    }

    company = await Company.update(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: company
    });
  }),

  // Изтриване на компания
  deleteCompany: asyncHandler(async (req, res, next) => {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return next(new ErrorResponse(`Не е намерена компания с ID ${req.params.id}`, 404));
    }

    // Проверка дали потребителят е собственик на компанията
    if (company.user_id !== req.user.id && req.user.user_type !== 'admin') {
      return next(new ErrorResponse('Нямате права да изтривате тази компания', 403));
    }

    await Company.delete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  }),

  // @desc    Качване на лого на компания
  // @route   POST /api/companies/:id/logo
  // @access  Private
  uploadLogo: asyncHandler(async (req, res, next) => {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return next(new ErrorResponse(`Не е намерена компания с ID ${req.params.id}`, 404));
    }

    // Проверка дали потребителят е собственик на компанията
    if (company.user_id !== req.user.id && req.user.user_type !== 'admin') {
      return next(new ErrorResponse('Нямате права да обновявате тази компания', 403));
    }

    // Тук трябва да добавите логика за качване на файл
    // Например с multer middleware
    if (!req.file) {
      return next(new ErrorResponse('Моля, качете файл', 400));
    }

    // Update company logo_url in the database
    const logoUrl = `/uploads/company-logos/${req.file.filename}`;
    
    const updatedCompany = await Company.update(req.params.id, {
      logo_url: logoUrl
    });

    res.status(200).json({
      success: true,
      data: updatedCompany
    });
  }),

  // @desc    Търсене на компании
  // @route   GET /api/companies/search
  // @access  Public
  searchCompanies: asyncHandler(async (req, res, next) => {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!query) {
      return next(new ErrorResponse('Моля, въведете критерии за търсене', 400));
    }

    const result = await Company.search(query, page, limit);

    res.status(200).json({
      success: true,
      count: result.companies.length,
      pagination: result.pagination,
      data: result.companies
    });
  }),

  // @desc    Получаване на активни обяви за работа на компания
  // @route   GET /api/companies/:id/jobs
  // @access  Public
  getCompanyActiveJobs: asyncHandler(async (req, res, next) => {
    // Проверка дали компанията съществува
    const company = await Company.findById(req.params.id);

    if (!company) {
      return next(new ErrorResponse(`Не е намерена компания с ID ${req.params.id}`, 404));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Търсене само на активни обяви за работа
    const filters = {
      company_id: req.params.id,
      status: 'active'
    };

    const result = await JobListing.findAll(page, limit, filters);

    res.status(200).json({
      success: true,
      count: result.jobs.length,
      pagination: result.pagination,
      data: result.jobs
    });
  }),

  // @desc    Филтриране на компании по индустрия
  // @route   GET /api/companies/industry/:industry
  // @access  Public
  getCompaniesByIndustry: asyncHandler(async (req, res, next) => {
    const { industry } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Получаване на общия брой компании в тази индустрия
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM companies WHERE industry = ?',
      [industry]
    );
    const total = countResult[0].total;

    // Получаване на компаниите с пагинация
    const [companies] = await pool.execute(`
      SELECT c.*, u.first_name, u.last_name, u.email
      FROM companies c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.industry = ?
      ORDER BY c.company_name ASC
      LIMIT ? OFFSET ?
    `, [industry, limit, offset]);

    res.status(200).json({
      success: true,
      count: companies.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: companies
    });
  }),

  // @desc    Получаване на всички индустрии
  // @route   GET /api/companies/industries
  // @access  Public
  getAllIndustries: asyncHandler(async (req, res, next) => {
    // Получаване на всички уникални индустрии от компаниите
    const [industries] = await pool.execute(`
      SELECT DISTINCT industry
      FROM companies
      WHERE industry IS NOT NULL
      ORDER BY industry ASC
    `);

    res.status(200).json({
      success: true,
      count: industries.length,
      data: industries.map(item => item.industry)
    });
  })
};

module.exports = companiesController; 