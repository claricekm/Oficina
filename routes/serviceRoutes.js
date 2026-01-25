const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/rbacMiddleware');

// GET /api/services/workshop/:workshopId - List services of a workshop (public)
router.get('/workshop/:workshopId', serviceController.getServicesByWorkshop);

// GET /api/services/:id - Get single service (public)
router.get('/:id', serviceController.getService);

// POST /api/services - Create service (admin only)
router.post('/', authMiddleware, adminOnly, serviceController.createService);

// PUT /api/services/:id - Update service (admin only)
router.put('/:id', authMiddleware, adminOnly, serviceController.updateService);

// DELETE /api/services/:id - Delete service (admin only)
router.delete('/:id', authMiddleware, adminOnly, serviceController.deleteService);

module.exports = router;
