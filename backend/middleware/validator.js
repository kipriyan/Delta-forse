const { check, validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

// Middleware за валидация
exports.validate = (validations) => {
  return async (req, res, next) => {
    // Изпълняване на всички валидации
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => err.msg);
    return next(new ErrorResponse(extractedErrors, 400));
  };
};

// Валидации за регистрация
exports.registerValidation = [
  check('username')
    .trim()
    .notEmpty()
    .withMessage('Потребителското име е задължително')
    .isLength({ min: 3 })
    .withMessage('Потребителското име трябва да е поне 3 символа')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Потребителското име може да съдържа само букви, цифри и _'),
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Имейлът е задължителен')
    .isEmail()
    .withMessage('Моля, въведете валиден имейл'),
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Паролата е задължителна')
    .isLength({ min: 6 })
    .withMessage('Паролата трябва да е поне 6 символа')
    .matches(/\d/).withMessage('Паролата трябва да съдържа поне една цифра')
    .matches(/[a-zA-Z]/).withMessage('Паролата трябва да съдържа поне една буква'),
  check('user_type')
    .optional()
    .isIn(['individual', 'company', 'admin'])
    .withMessage('Невалиден тип потребител')
];

// Валидации за вход
exports.loginValidation = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Имейлът е задължителен')
    .isEmail()
    .withMessage('Моля, въведете валиден имейл'),
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Паролата е задължителна')
];

// Валидации за създаване на компания
exports.companyValidation = [
  check('company_name')
    .trim()
    .notEmpty()
    .withMessage('Името на компанията е задължително')
    .isLength({ min: 2, max: 100 })
    .withMessage('Името на компанията трябва да е между 2 и 100 символа'),
  check('industry')
    .trim()
    .notEmpty()
    .withMessage('Индустрията е задължителна'),
  check('website')
    .optional()
    .isURL()
    .withMessage('Въведете валиден URL за уебсайта')
];

// Валидации за създаване на обява
exports.jobValidation = [
  check('title')
    .trim()
    .notEmpty()
    .withMessage('Заглавието е задължително')
    .isLength({ min: 5, max: 100 })
    .withMessage('Заглавието трябва да е между 5 и 100 символа'),
  check('description')
    .trim()
    .notEmpty()
    .withMessage('Описанието е задължително')
    .isLength({ min: 10 })
    .withMessage('Описанието трябва да е поне 10 символа'),
  check('location')
    .trim()
    .notEmpty()
    .withMessage('Локацията е задължителна'),
  check('job_type')
    .trim()
    .notEmpty()
    .withMessage('Типът работа е задължителен')
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'remote'])
    .withMessage('Невалиден тип работа'),
  check('salary')
    .optional()
    .matches(/^\d+-\d+$|^\d+$/)
    .withMessage('Невалиден формат за заплата (примери: 1000 или 1000-2000)'),
  check('application_deadline')
    .optional()
    .isISO8601()
    .withMessage('Невалиден формат за дата')
    .custom((value) => {
      const deadline = new Date(value);
      const now = new Date();
      if (deadline < now) {
        throw new Error('Крайният срок не може да бъде в миналото');
      }
      return true;
    })
];

// Валидации за създаване на обява за екипировка
exports.equipmentValidation = [
  check('title')
    .trim()
    .notEmpty()
    .withMessage('Заглавието е задължително')
    .isLength({ min: 5, max: 100 })
    .withMessage('Заглавието трябва да е между 5 и 100 символа'),
  check('description')
    .trim()
    .notEmpty()
    .withMessage('Описанието е задължително')
    .isLength({ min: 10 })
    .withMessage('Описанието трябва да е поне 10 символа'),
  check('category')
    .trim()
    .notEmpty()
    .withMessage('Категорията е задължителна'),
  check('condition')
    .trim()
    .notEmpty()
    .withMessage('Състоянието е задължително')
    .isIn(['new', 'excellent', 'good', 'fair', 'poor'])
    .withMessage('Невалидно състояние'),
  check('daily_rate')
    .notEmpty()
    .withMessage('Дневната цена е задължителна')
    .isNumeric()
    .withMessage('Дневната цена трябва да е число')
    .custom(value => value > 0)
    .withMessage('Дневната цена трябва да е положително число'),
  check('location')
    .trim()
    .notEmpty()
    .withMessage('Локацията е задължителна')
];

// Валидации за заявка за наемане на екипировка
exports.rentalValidation = [
  check('equipment_id')
    .notEmpty()
    .withMessage('ID на екипировката е задължително')
    .isNumeric()
    .withMessage('ID на екипировката трябва да е число'),
  check('rental_start')
    .notEmpty()
    .withMessage('Началната дата е задължителна')
    .isISO8601()
    .withMessage('Невалиден формат за дата')
    .custom(value => {
      const start = new Date(value);
      const now = new Date();
      if (start < now) {
        throw new Error('Началната дата не може да бъде в миналото');
      }
      return true;
    }),
  check('rental_end')
    .notEmpty()
    .withMessage('Крайната дата е задължителна')
    .isISO8601()
    .withMessage('Невалиден формат за дата')
    .custom((value, { req }) => {
      const start = new Date(req.body.rental_start);
      const end = new Date(value);
      if (end <= start) {
        throw new Error('Крайната дата трябва да е след началната дата');
      }
      return true;
    })
];

// Валидации за кандидатстване за работа
exports.jobApplicationValidation = [
  check('job_id')
    .notEmpty()
    .withMessage('ID на обявата е задължително')
    .isNumeric()
    .withMessage('ID на обявата трябва да е число'),
  check('cover_letter')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Мотивационното писмо не може да надвишава 5000 символа'),
  check('resume_url')
    .optional()
    .isURL()
    .withMessage('Въведете валиден URL за CV')
    .custom((value, { req }) => {
      if (!value && !req.body.resume_file) {
        throw new Error('Моля, предоставете CV като URL или качете файл');
      }
      return true;
    })
];

// Валидатор за регистрация
exports.validateRegistration = (req, res, next) => {
  const { username, email, password, user_type } = req.body;
  
  console.log('Данни за регистрация:', { username, email, password: '***', user_type });
  console.log('Валидни типове потребител:', ['person', 'company', 'admin']);
  
  if (!username || !email || !password) {
    return next(new ErrorResponse('Моля, попълнете всички задължителни полета', 400));
  }
  
  if (password.length < 6) {
    return next(new ErrorResponse('Паролата трябва да бъде поне 6 символа', 400));
  }
  
  // Проверка за валиден тип потребител - трябва да използваме правилните валидни стойности
  const validUserTypes = ['person', 'company', 'admin']; // Точно както в базата данни
  if (!validUserTypes.includes(user_type)) {
    return next(new ErrorResponse('Невалиден тип потребител', 400));
  }
  
  next();
}; 