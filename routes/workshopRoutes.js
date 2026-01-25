const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/rbacMiddleware');

// GET /api/workshops - List all workshops (public)
router.get('/', workshopController.getAllWorkshops);

// GET /api/workshops/:id - Get one workshop (public)
router.get('/:id', workshopController.getWorkshop);

// GET /api/workshops/:id/services - Get services from a workshop (public)
router.get('/:id/services', workshopController.getWorkshopServices);

// PUT /api/workshops/:id - Update workshop (admin only, ownership validated in controller)
router.put('/:id', authMiddleware, adminOnly, workshopController.updateWorkshop);

module.exports = router;
