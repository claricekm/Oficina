const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/workshops - List all workshops (public)
router.get('/', workshopController.getAllWorkshops);

// GET /api/workshops/:id - Get one workshop (public)
router.get('/:id', workshopController.getWorkshop);

// PUT /api/workshops/:id - Update workshop (protected, only owner)
router.put('/:id', authMiddleware, workshopController.updateWorkshop);

module.exports = router;
