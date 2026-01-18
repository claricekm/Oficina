const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/services/workshop/:workshopId - List services of a workshop (public)
router.get('/workshop/:workshopId', serviceController.getServicesByWorkshop);

// GET /api/services/:id - Get single service (public)
router.get('/:id', serviceController.getService);

// POST /api/services - Create service (protected, admin only)
router.post('/', authMiddleware, serviceController.createService);

// PUT /api/services/:id - Update service (protected, admin only)
router.put('/:id', authMiddleware, serviceController.updateService);

// DELETE /api/services/:id - Delete service (protected, admin only)
router.delete('/:id', authMiddleware, serviceController.deleteService);

module.exports = router;
