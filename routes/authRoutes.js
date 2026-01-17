const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register/admin
router.post('/register/admin', authController.registerAdmin);

// POST /api/auth/register/customer
router.post('/register/customer', authController.registerCustomer);

// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;
