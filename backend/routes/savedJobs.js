const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  saveJob,
  unsaveJob,
  getSavedJobs
} = require('../controllers/savedJobsController');

router.route('/')
  .post(protect, saveJob)
  .get(protect, getSavedJobs);

router.route('/:job_id')
  .delete(protect, unsaveJob);

module.exports = router; 