const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/rbacMiddleware');

// GET /api/statistics/dashboard - Get dashboard KPIs (admin only)
router.get('/dashboard', authMiddleware, adminOnly, statisticsController.getDashboardStats);

// GET /api/statistics/mechanics - Get mechanics list (admin only)
router.get('/mechanics', authMiddleware, adminOnly, statisticsController.getMechanics);

// DELETE /api/statistics/mechanics/:id - Delete mechanic (admin only)
router.delete('/mechanics/:id', authMiddleware, adminOnly, statisticsController.deleteMechanic);

module.exports = router;
