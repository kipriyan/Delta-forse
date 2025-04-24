const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./middleware/error');
const { connectDB } = require('./config/db');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { specs, swaggerUi } = require('./config/swagger');

// Зареждане на env променливи
dotenv.config();

// Свързване с базата данни
connectDB();

// Рутове
const auth = require('./routes/auth');
const companies = require('./routes/companies');
const jobs = require('./routes/jobs');
const profile = require('./routes/profile');
const applications = require('./routes/applications');
const savedJobs = require('./routes/savedJobs');
const search = require('./routes/search');
const equipment = require('./routes/equipment');
const equipmentRentals = require('./routes/equipmentRentals');

const app = express();

const whatIsTheRoute = (req, res, next) => {
  console.log(`Маршрут: ${req.method} ${req.originalUrl}`);
  next();
};

app.use(whatIsTheRoute);

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Security Headers
app.use(helmet());

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Разрешаваме и двата порта
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Логиране в dev режим
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 минути
  max: 100 // максимум 100 заявки за период
});
app.use('/api/', limiter);

// Монтиране на маршрутите
app.use('/api/auth', auth);
app.use('/api/companies', companies);
app.use('/api/jobs', jobs);
app.use('/api/profile', profile);
app.use('/api/applications', applications);
app.use('/api/saved-jobs', savedJobs);
app.use('/api/search', search);
app.use('/api/equipment', equipment);
app.use('/api/equipment-rentals', equipmentRentals);

// Swagger документация
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Статични файлове
app.use(express.static(path.join(__dirname, 'public')));

// Middleware за обработка на грешки
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Сървърът е стартиран на порт ${PORT}`);
});

// Обработка на необработени отхвърляния на промиси
process.on('unhandledRejection', (err, promise) => {
  console.log(`Грешка: ${err.message}`);
  // Затваряне на сървъра и приключване на процеса
  server.close(() => process.exit(1));
}); 