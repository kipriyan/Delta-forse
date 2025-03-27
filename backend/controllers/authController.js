const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const sendEmail = require('../utils/sendEmail');
const config = require('../config/config');

// @desc    Регистрация на потребител
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password, user_type, first_name, last_name, phone } = req.body;

  // Валидация на типа потребител
  const validUserTypes = ['person', 'company', 'admin'];
  if (!validUserTypes.includes(user_type)) {
    return next(new ErrorResponse(`Невалиден тип потребител`, 400));
  }

  // Проверка дали потребителят вече съществува
  const [userExists] = await pool.execute(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [email, username]
  );

  if (userExists.length > 0) {
    return next(new ErrorResponse('Потребителското име или имейл адресът вече са регистрирани', 400));
  }

  // Криптиране на паролата
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Вмъкване на потребителя в базата данни
  const [result] = await pool.execute(
    `INSERT INTO users (username, email, password_hash, user_type, first_name, last_name, phone, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [username, email, hashedPassword, user_type, first_name || null, last_name || null, phone || null]
  );

  // Създаване на JWT токен
  const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });

  // Създаваме ръчно потребителския обект
  const user = {
    id: result.insertId,
    username,
    email,
    user_type
  };

  // Връщаме успех с токена и базовите данни на потребителя
  res.status(201).json({
    success: true,
    token,
    user
  });
});

// @desc    Вход на потребител
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Валидация
  if (!email || !password) {
    return next(new ErrorResponse('Моля, въведете имейл и парола', 400));
  }

  // Проверка на потребителя
  const [users] = await pool.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    return next(new ErrorResponse('Невалидни идентификационни данни', 401));
  }

  const user = users[0];

  // Проверка на паролата - използваме password_hash
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return next(new ErrorResponse('Невалидни идентификационни данни', 401));
  }

  // Създаване на токен
  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  // Създаваме потребителски обект с всички необходими полета
  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    user_type: user.user_type
  };

  // Връщаме успешен отговор с токена и потребителските данни
  res.status(200).json({
    success: true,
    token,
    user: userResponse
  });
});

// @desc    Изход от системата
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Получаване на текущия потребител
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Обновяване на детайлите на потребителя
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    username: req.body.username,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    bio: req.body.bio
  };

  // Премахване на undefined полета
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.update(req.user.id, fieldsToUpdate);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Обновяване на паролата
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findByEmail(req.user.email);

  // Проверка на текущата парола
  const isMatch = await user.matchPassword(req.body.currentPassword);

  if (!isMatch) {
    return next(new ErrorResponse('Текущата парола е неправилна', 401));
  }

  await User.update(user.id, { password: req.body.newPassword });

  sendTokenResponse(user, 200, res);
});

// @desc    Забравена парола
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findByEmail(req.body.email);

  if (!user) {
    return next(new ErrorResponse('Няма потребител с този имейл адрес', 404));
  }

  // Вземане на токен за нулиране
  const resetToken = await user.getResetPasswordToken();

  // Създаване на URL за нулиране
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/resetpassword/${resetToken}`;

  const message = `Получавате този имейл, защото заявихте нулиране на паролата си. Моля, направете PUT заявка към: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Токен за нулиране на парола',
      message,
      html: `<p>Получавате този имейл, защото заявихте нулиране на паролата си.</p><p>Моля, кликнете на <a href="${resetUrl}">този линк</a>, за да нулирате паролата си.</p>`
    });

    res.status(200).json({ success: true, data: 'Имейлът е изпратен' });
  } catch (err) {
    console.log(err);

    // Нулиране на токена
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await User.update(user.id, {
      reset_password_token: null,
      reset_password_expire: null
    });

    return next(new ErrorResponse('Имейлът не може да бъде изпратен', 500));
  }
});

// @desc    Нулиране на паролата
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Вземане на хеширания токен
  const resetToken = req.params.resettoken;

  const user = await User.findByResetToken(resetToken);

  if (!user) {
    return next(new ErrorResponse('Невалиден токен', 400));
  }

  // Задаване на нова парола
  await User.update(user.id, {
    password: req.body.password,
    reset_password_token: null,
    reset_password_expire: null
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Проверка дали потребителят е влязъл в системата
// @route   GET /api/auth/status
// @access  Public
exports.checkAuthStatus = asyncHandler(async (req, res, next) => {
  // Проверява се дали има JWT токен в бисквитките
  let token;
  
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(200).json({
      success: true,
      isAuthenticated: false,
      user: null
    });
  }

  try {
    // Валидация на токена
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        user: null
      });
    }

    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        user_type: user.user_type,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      isAuthenticated: false,
      user: null
    });
  }
});

// Генериране на JWT токен и изпращане на отговор
const sendTokenResponse = (user, statusCode, res) => {
  // Създаване на JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, user_type: user.user_type },
    config.JWT_SECRET,
    {
      expiresIn: config.JWT_EXPIRE
    }
  );

  // Cookie опции
  const options = {
    expires: new Date(
      Date.now() + config.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        user_type: user.user_type
      }
    });
}; 