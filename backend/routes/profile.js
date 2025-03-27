const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { pool } = require('../config/db');
const util = require('util');

// Временно импортиране само на дефинираните функции
// и добавяне на заместители за липсващите
const profileController = require('../controllers/profileController');

// Извличане на функциите, които съществуват, или създаване на заместваща функция
const getProfile = profileController.getProfile || ((req, res) => {
  res.status(200).json({ success: true, message: 'getProfile не е имплементирана' });
});

const addSkill = profileController.addSkill || ((req, res) => {
  res.status(200).json({ success: true, message: 'addSkill не е имплементирана' });
});

const removeSkill = profileController.removeSkill || ((req, res) => {
  res.status(200).json({ success: true, message: 'removeSkill не е имплементирана' });
});

const addEducation = profileController.addEducation || ((req, res) => {
  res.status(200).json({ success: true, message: 'addEducation не е имплементирана' });
});

const updateEducation = profileController.updateEducation || ((req, res) => {
  res.status(200).json({ success: true, message: 'updateEducation не е имплементирана' });
});

const deleteEducation = profileController.deleteEducation || ((req, res) => {
  res.status(200).json({ success: true, message: 'deleteEducation не е имплементирана' });
});

const addExperience = profileController.addExperience || ((req, res) => {
  res.status(200).json({ success: true, message: 'addExperience не е имплементирана' });
});

const updateExperience = profileController.updateExperience || ((req, res) => {
  res.status(200).json({ success: true, message: 'updateExperience не е имплементирана' });
});

const deleteExperience = profileController.deleteExperience || ((req, res) => {
  res.status(200).json({ success: true, message: 'deleteExperience не е имплементирана' });
});

// Основни маршрути
router.get('/', protect, getProfile);

// Маршрути за умения
router.route('/skills')
  .post(protect, addSkill);
router.route('/skills/:id')
  .delete(protect, removeSkill);

// Маршрути за образование
router.route('/education')
  .post(protect, addEducation);
router.route('/education/:id')
  .put(protect, updateEducation)
  .delete(protect, deleteEducation);

// Маршрути за опит
router.route('/experience')
  .post(protect, addExperience);
router.route('/experience/:id')
  .put(protect, updateExperience)
  .delete(protect, deleteExperience);

// Добавяме нов маршрут за извличане на обявите на потребителя
router.get('/jobs', protect, (req, res) => {
  console.log('GET /api/profile/jobs започва изпълнение');
  
  const queryAsync = async () => {
    try {
      // Използваме връзка с увеличен таймаут
      const connection = await pool.getConnection();
      console.log('Успешно свързване към базата данни');
      
      // Използваме promise-базиран подход вместо callback
      const [results] = await connection.query(
        'SELECT * FROM job_listings WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
      );
      
      console.log(`Заявката върна ${results ? results.length : 0} резултата`);
      connection.release();
      
      res.status(200).json({
        success: true,
        count: results ? results.length : 0,
        data: results || []
      });
    } catch (error) {
      console.error('ERROR при извличане на обяви:', error);
      res.status(500).json({
        success: false,
        error: 'Грешка при извличане на обявите: ' + (error.message || 'Неизвестна грешка')
      });
    }
  };
  
  // Стартиране на заявката с таймаут
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Таймаут на заявката')), 10000);
  });
  
  // Изпълняваме заявката с таймаут
  Promise.race([queryAsync(), timeoutPromise])
    .catch(error => {
      console.error('Грешка при изпълнение на заявката:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Времето за изпълнение на заявката изтече'
        });
      }
    });
});

// Поправен маршрут (ако функцията липсва в контролера)
router.post('/something', async (req, res) => {
  // Временна заместваща функция
  res.status(200).json({
    success: true,
    message: 'Функционалността предстои да бъде имплементирана'
  });
});

// Маршрути за управление на кандидатурите на потребителя
router.get('/applications', protect, profileController.getUserApplications || ((req, res) => {
  // Временна имплементация
  try {
    pool.query(
      `SELECT a.*, j.title as job_title, j.company_id, j.location, j.salary, 
             u.username as employer_name, u.email as employer_email
      FROM job_applications a
      JOIN job_listings j ON a.job_id = j.id
      LEFT JOIN users u ON j.user_id = u.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC`,
      [req.user.id],
      (error, results) => {
        if (error) {
          console.error('Грешка при извличане на кандидатури:', error);
          return res.status(500).json({
            success: false, 
            error: 'Грешка при извличане на кандидатурите'
          });
        }
        
        res.status(200).json({
          success: true,
          count: results.length,
          data: results
        });
      }
    );
  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'Сървърна грешка'
    });
  }
}));

router.put('/applications/:id', protect, profileController.updateApplication || ((req, res) => {
  // Временна имплементация
  const applicationId = req.params.id;
  const userId = req.user.id;
  const { cover_letter } = req.body;
  
  if (!cover_letter) {
    return res.status(400).json({
      success: false,
      error: 'Моля, предоставете мотивационно писмо'
    });
  }
  
  // Проверка и актуализиране
  pool.query(
    'SELECT * FROM job_applications WHERE id = ? AND user_id = ?',
    [applicationId, userId],
    (error, application) => {
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Грешка при извличане на кандидатурата'
        });
      }
      
      if (!application || application.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Кандидатурата не е намерена или нямате права да я редактирате'
        });
      }
      
      // Актуализиране
      pool.query(
        'UPDATE job_applications SET cover_letter = ? WHERE id = ?',
        [cover_letter, applicationId],
        (error, result) => {
          if (error) {
            return res.status(500).json({
              success: false,
              error: 'Грешка при актуализиране на кандидатурата'
            });
          }
          
          res.status(200).json({
            success: true,
            data: {
              id: applicationId,
              cover_letter: cover_letter
            }
          });
        }
      );
    }
  );
}));

router.delete('/applications/:id', protect, profileController.deleteApplication || ((req, res) => {
  // Временна имплементация
  const applicationId = req.params.id;
  const userId = req.user.id;
  
  // Проверка и изтриване
  pool.query(
    'SELECT * FROM job_applications WHERE id = ? AND user_id = ?',
    [applicationId, userId],
    (error, application) => {
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Грешка при извличане на кандидатурата'
        });
      }
      
      if (!application || application.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Кандидатурата не е намерена или нямате права да я изтриете'
        });
      }
      
      // Изтриване
      pool.query(
        'DELETE FROM job_applications WHERE id = ?',
        [applicationId],
        (error, result) => {
          if (error) {
            return res.status(500).json({
              success: false,
              error: 'Грешка при изтриване на кандидатурата'
            });
          }
          
          res.status(200).json({
            success: true,
            message: 'Кандидатурата е изтрита успешно'
          });
        }
      );
    }
  );
}));

module.exports = router; 