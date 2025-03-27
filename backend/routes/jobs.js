const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, jobValidation } = require('../middleware/validator');

// Импортиране на контролера
const jobsController = require('../controllers/jobsController');
const jobsControllerNew = require('../controllers/jobsControllerNew');

// Маршрути за обяви за работа
router.get('/', jobsControllerNew.getAllJobs);
router.post('/', protect, jobsController.createJob);

// Получаване на моите обяви
router.route('/my')
  .get(protect, jobsController.getMyJobs);

// Маршрути за търсене и филтриране
router.route('/search').get(jobsController.searchJobs);
router.route('/advanced-search').get(jobsController.advancedSearch);
router.route('/filter-options').get(jobsController.getFilterOptions);

// Маршрути за кандидатури
router.route('/applications/my').get(protect, jobsController.getMyApplications);
router.route('/saved').get(protect, jobsController.getSavedJobs);

// Маршрути за компания
router.route('/company/:companyId')
  .get(jobsController.getCompanyJobs);

// Маршрути за конкретна обява
router.get('/:id', jobsController.getJobById);
router.put('/:id', protect, jobsController.updateJob);
router.delete('/:id', protect, jobsController.deleteJob);

// Маршрут за промяна на статуса на обява
router.route('/:id/status')
  .put(protect, jobsController.updateJobStatus);

// Маршрути за кандидатстване
router.post('/:id/apply', protect, jobsController.applyForJob);
router.route('/:id/applications').get(protect, jobsController.getJobApplications);

// Маршрути за запазване на обяви
router.route('/:id/save')
  .post(protect, jobsController.saveJob)
  .delete(protect, jobsController.unsaveJob);

// Маршрути за управление на кандидатури
router.route('/applications/:id')
  .put(protect, jobsController.updateApplicationStatus)
  .delete(protect, jobsController.deleteApplication);

// Маршрут за преглед на кандидатурите за конкретна обява
router.get('/:id/applications', protect, jobsController.getJobApplications);

// Маршрут за промяна на статуса на кандидатура
router.put('/applications/:id', protect, jobsController.updateApplicationStatus);

module.exports = router; 