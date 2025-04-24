const { RateLimiterMemory } = require('rate-limiter-flexible');

// Създаване на ограничител на скоростта на заявките
const rateLimiter = new RateLimiterMemory({
  points: 10, // брой точки
  duration: 10, // за 10 секунди
  blockDuration: 30, // блокиране за 30 секунди при надвишаване
});

// Middleware функция за ограничаване на заявките
const rateLimiterMiddleware = (req, res, next) => {
  // Получаване на IP адреса или друг идентификатор на потребителя
  const userKey = req.ip;
  
  rateLimiter.consume(userKey)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.'
      });
    });
};

module.exports = rateLimiterMiddleware; 