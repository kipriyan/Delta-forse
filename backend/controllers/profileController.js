const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const { pool } = require('../config/db');
const User = require('../models/User');

// @desc    Получаване на профила на потребителя
// @route   GET /api/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Получаване на уменията на потребителя
  const [skills] = await pool.execute(`
    SELECT s.id, s.name, us.proficiency_level
    FROM skills s
    INNER JOIN user_skills us ON s.id = us.skill_id
    WHERE us.user_id = ?
  `, [req.user.id]);

  // Получаване на образованието на потребителя
  const [education] = await pool.execute(`
    SELECT * FROM user_education
    WHERE user_id = ?
    ORDER BY start_date DESC
  `, [req.user.id]);

  // Получаване на опита на потребителя
  const [experience] = await pool.execute(`
    SELECT * FROM user_experience
    WHERE user_id = ?
    ORDER BY start_date DESC
  `, [req.user.id]);

  res.status(200).json({
    success: true,
    data: {
      user,
      skills,
      education,
      experience
    }
  });
});

// @desc    Добавяне на умение към профила
// @route   POST /api/profile/skills
// @access  Private
exports.addSkill = asyncHandler(async (req, res, next) => {
  const { skill_id, proficiency_level } = req.body;

  // Проверка дали умението съществува
  const [skill] = await pool.execute(`
    SELECT * FROM skills WHERE id = ?
  `, [skill_id]);

  if (skill.length === 0) {
    return next(new ErrorResponse(`Не е намерено умение с ID ${skill_id}`, 404));
  }

  // Проверка дали потребителят вече има това умение
  const [existingSkill] = await pool.execute(`
    SELECT * FROM user_skills
    WHERE user_id = ? AND skill_id = ?
  `, [req.user.id, skill_id]);

  if (existingSkill.length > 0) {
    return next(new ErrorResponse('Това умение вече е добавено към профила ви', 400));
  }

  // Добавяне на умението
  await pool.execute(`
    INSERT INTO user_skills (user_id, skill_id, proficiency_level)
    VALUES (?, ?, ?)
  `, [req.user.id, skill_id, proficiency_level || 'intermediate']);

  // Получаване на добавеното умение с подробности
  const [addedSkill] = await pool.execute(`
    SELECT s.id, s.name, us.proficiency_level
    FROM skills s
    INNER JOIN user_skills us ON s.id = us.skill_id
    WHERE us.user_id = ? AND us.skill_id = ?
  `, [req.user.id, skill_id]);

  res.status(201).json({
    success: true,
    data: addedSkill[0]
  });
});

// @desc    Премахване на умение от профила
// @route   DELETE /api/profile/skills/:id
// @access  Private
exports.removeSkill = asyncHandler(async (req, res, next) => {
  // Проверка дали умението е добавено към профила на потребителя
  const [existingSkill] = await pool.execute(`
    SELECT * FROM user_skills
    WHERE user_id = ? AND skill_id = ?
  `, [req.user.id, req.params.id]);

  if (existingSkill.length === 0) {
    return next(new ErrorResponse('Това умение не е намерено във вашия профил', 404));
  }

  // Премахване на умението
  await pool.execute(`
    DELETE FROM user_skills
    WHERE user_id = ? AND skill_id = ?
  `, [req.user.id, req.params.id]);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Добавяне на образование към профила
// @route   POST /api/profile/education
// @access  Private
exports.addEducation = asyncHandler(async (req, res, next) => {
  const { institution, degree, field_of_study, start_date, end_date, description } = req.body;

  // Добавяне на образованието
  const [result] = await pool.execute(`
    INSERT INTO user_education 
    (user_id, institution, degree, field_of_study, start_date, end_date, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    req.user.id, 
    institution, 
    degree, 
    field_of_study || null, 
    start_date, 
    end_date || null, 
    description || null
  ]);

  // Получаване на добавеното образование
  const [education] = await pool.execute(`
    SELECT * FROM user_education WHERE id = ?
  `, [result.insertId]);

  res.status(201).json({
    success: true,
    data: education[0]
  });
});

// @desc    Обновяване на образование
// @route   PUT /api/profile/education/:id
// @access  Private
exports.updateEducation = asyncHandler(async (req, res, next) => {
  // Проверка дали образованието принадлежи на потребителя
  const [existingEducation] = await pool.execute(`
    SELECT * FROM user_education
    WHERE id = ? AND user_id = ?
  `, [req.params.id, req.user.id]);

  if (existingEducation.length === 0) {
    return next(new ErrorResponse('Образованието не е намерено или нямате права за достъп', 404));
  }

  const { institution, degree, field_of_study, start_date, end_date, description } = req.body;

  // Обновяване на образованието
  await pool.execute(`
    UPDATE user_education
    SET institution = ?, degree = ?, field_of_study = ?, start_date = ?, end_date = ?, description = ?
    WHERE id = ? AND user_id = ?
  `, [
    institution || existingEducation[0].institution,
    degree || existingEducation[0].degree,
    field_of_study || existingEducation[0].field_of_study,
    start_date || existingEducation[0].start_date,
    end_date || existingEducation[0].end_date,
    description || existingEducation[0].description,
    req.params.id,
    req.user.id
  ]);

  // Получаване на обновеното образование
  const [education] = await pool.execute(`
    SELECT * FROM user_education WHERE id = ?
  `, [req.params.id]);

  res.status(200).json({
    success: true,
    data: education[0]
  });
});

// @desc    Премахване на образование
// @route   DELETE /api/profile/education/:id
// @access  Private
exports.deleteEducation = asyncHandler(async (req, res, next) => {
  // Проверка дали образованието принадлежи на потребителя
  const [existingEducation] = await pool.execute(`
    SELECT * FROM user_education
    WHERE id = ? AND user_id = ?
  `, [req.params.id, req.user.id]);

  if (existingEducation.length === 0) {
    return next(new ErrorResponse('Образованието не е намерено или нямате права за достъп', 404));
  }

  // Премахване на образованието
  await pool.execute(`
    DELETE FROM user_education
    WHERE id = ? AND user_id = ?
  `, [req.params.id, req.user.id]);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Аналогични методи за работа с опит (add, update, delete)... 

// @desc    Извличане на кандидатурите на текущия потребител
// @route   GET /api/profile/applications
// @access  Private
exports.getUserApplications = async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Извличане на всички кандидатури на потребителя заедно с информация за обявите
    const [applications] = await pool.query(`
      SELECT a.*, j.title as job_title, j.company_id, j.location, j.salary, 
             u.username as employer_name, u.email as employer_email
      FROM job_applications a
      JOIN job_listings j ON a.job_id = j.id
      LEFT JOIN users u ON j.user_id = u.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `, [userId]);
    
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('ERROR в getUserApplications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Грешка при извличане на кандидатурите'
    });
  }
};

// @desc    Редактиране на кандидатура
// @route   PUT /api/profile/applications/:id
// @access  Private
exports.updateApplication = async (req, res) => {
  const applicationId = req.params.id;
  const userId = req.user.id;
  const { cover_letter } = req.body;
  
  try {
    // Проверка дали кандидатурата принадлежи на текущия потребител
    const [application] = await pool.query(
      'SELECT * FROM job_applications WHERE id = ? AND user_id = ?',
      [applicationId, userId]
    );
    
    if (!application || application.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Кандидатурата не е намерена или нямате права да я редактирате'
      });
    }
    
    // Проверка дали кандидатурата е все още в състояние, което позволява редактиране
    if (application[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Можете да редактирате само кандидатури със статус "В процес"'
      });
    }
    
    // Актуализиране на кандидатурата
    const [result] = await pool.execute(
      'UPDATE job_applications SET cover_letter = ? WHERE id = ?',
      [cover_letter, applicationId]
    );
    
    if (result.affectedRows > 0) {
      // Връщане на обновената кандидатура
      const [updatedApp] = await pool.query(`
        SELECT a.*, j.title as job_title
        FROM job_applications a
        JOIN job_listings j ON a.job_id = j.id
        WHERE a.id = ?
      `, [applicationId]);
      
      res.status(200).json({
        success: true,
        data: updatedApp[0]
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Неуспешна актуализация на кандидатурата'
      });
    }
  } catch (error) {
    console.error('ERROR в updateApplication:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Грешка при актуализиране на кандидатурата'
    });
  }
};

// @desc    Изтриване на кандидатура
// @route   DELETE /api/profile/applications/:id
// @access  Private
exports.deleteApplication = async (req, res) => {
  const applicationId = req.params.id;
  const userId = req.user.id;
  
  try {
    // Проверка дали кандидатурата принадлежи на текущия потребител
    const [application] = await pool.query(
      'SELECT * FROM job_applications WHERE id = ? AND user_id = ?',
      [applicationId, userId]
    );
    
    if (!application || application.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Кандидатурата не е намерена или нямате права да я изтриете'
      });
    }
    
    // Изтриване на кандидатурата
    const [result] = await pool.execute(
      'DELETE FROM job_applications WHERE id = ?',
      [applicationId]
    );
    
    if (result.affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: 'Кандидатурата е изтрита успешно'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Неуспешно изтриване на кандидатурата'
      });
    }
  } catch (error) {
    console.error('ERROR в deleteApplication:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Грешка при изтриване на кандидатурата'
    });
  }
}; 