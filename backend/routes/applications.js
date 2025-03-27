const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplication,
  deleteApplication
} = require('../controllers/applicationsController');

router.route('/')
  .post(protect, applyForJob)
  .get(protect, getMyApplications);

router.route('/job/:job_id')
  .get(protect, getJobApplications);

router.route('/:id')
  .put(protect, updateApplication)
  .delete(protect, deleteApplication);

module.exports = router; 