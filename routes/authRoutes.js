const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/rbacMiddleware');

console.log('✅ authRoutes.js carregado');

// POST /api/auth/register/admin - Register Admin + Workshop
router.post('/register/admin', authController.registerAdmin);

// POST /api/auth/register/customer - Register Customer
router.post('/register/customer', authController.registerCustomer);

// POST /api/auth/register/mechanic - Register Mechanic (Admin only)
router.post('/register/mechanic', authMiddleware, adminOnly, authController.registerMechanic);

// POST /api/auth/login - Login
router.post('/login', authController.login);

// POST /api/auth/refresh - Refresh access token using refresh token
router.post('/refresh', authController.refresh);

// POST /api/auth/logout - Logout and clear tokens
router.post('/logout', authController.logout);

module.exports = router;
