const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

console.log('✅ authRoutes.js carregado');

// POST /api/auth/register/admin - Register Admin + Workshop
router.post('/register/admin', authController.registerAdmin);

// POST /api/auth/register/customer - Register Customer
router.post('/register/customer', authController.registerCustomer);

// POST /api/auth/login - Login
router.post('/login', authController.login);

module.exports = router;
