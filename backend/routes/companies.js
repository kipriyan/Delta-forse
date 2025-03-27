const express = require('express');
const router = express.Router();
const companiesController = require('../controllers/companiesController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Публични рутове
router.get('/', companiesController.getAllCompanies);
router.get('/:id', companiesController.getCompanyById);

// Защитени рутове
router.post('/', protect, authorize('company'), companiesController.createCompany);
router.put('/:id', protect, companiesController.updateCompany);
router.delete('/:id', protect, companiesController.deleteCompany);

// Управление на лого
router.post('/:id/logo', protect, upload.single('logo'), companiesController.uploadLogo);

module.exports = router; 