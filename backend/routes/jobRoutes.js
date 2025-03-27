const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Импортиране на контролери
const jobsController = require('../controllers/jobsController');
const jobsControllerNew = require('../controllers/jobsControllerNew');

// ВАЖНО: Използваме новия контролер за всички обяви
router.get('/', jobsControllerNew.getAllJobs);

// Останалите маршрути остават същите
router.post('/', protect, jobsController.createJob);
router.get('/:id', jobsController.getJobById);
router.put('/:id', protect, jobsController.updateJob);
router.delete('/:id', protect, jobsController.deleteJob);
router.post('/:id/apply', protect, jobsController.applyForJob);

module.exports = router;