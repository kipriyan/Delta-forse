const express = require('express');
const router = express.Router();
const {
  advancedSearch,
  getPopularSearches
} = require('../controllers/searchController');

router.route('/')
  .get(advancedSearch);

router.route('/popular')
  .get(getPopularSearches);

module.exports = router; 