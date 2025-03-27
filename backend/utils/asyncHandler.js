// Помощна функция за обработка на асинхронни функции и избягване на try-catch блокове
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 