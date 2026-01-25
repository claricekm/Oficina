const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly, adminOrMechanic } = require('../middleware/rbacMiddleware');

// GET /api/shifts/workshop/:workshopId - Get shifts of a workshop
router.get('/workshop/:workshopId', shiftController.getShiftsByWorkshop);

// GET /api/shifts/mechanic/:mechanicId - Get shifts of a mechanic (admin or mechanic)
router.get('/mechanic/:mechanicId', authMiddleware, adminOrMechanic, shiftController.getShiftsByMechanic);

// GET /api/shifts/:id - Get single shift (admin or mechanic)
router.get('/:id', authMiddleware, adminOrMechanic, shiftController.getShift);

// POST /api/shifts - Create shift (admin only)
router.post('/', authMiddleware, adminOnly, shiftController.createShift);

// PUT /api/shifts/:id - Update shift (admin only)
router.put('/:id', authMiddleware, adminOnly, shiftController.updateShift);

// DELETE /api/shifts/:id - Delete shift (admin only)
router.delete('/:id', authMiddleware, adminOnly, shiftController.deleteShift);

module.exports = router;
