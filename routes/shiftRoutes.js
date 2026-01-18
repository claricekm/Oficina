const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/shifts/workshop/:workshopId - Get shifts of a workshop
router.get('/workshop/:workshopId', shiftController.getShiftsByWorkshop);

// GET /api/shifts/mechanic/:mechanicId - Get shifts of a mechanic
router.get('/mechanic/:mechanicId', authMiddleware, shiftController.getShiftsByMechanic);

// GET /api/shifts/:id - Get single shift
router.get('/:id', authMiddleware, shiftController.getShift);

// POST /api/shifts - Create shift (admin only)
router.post('/', authMiddleware, shiftController.createShift);

// PUT /api/shifts/:id - Update shift (admin only)
router.put('/:id', authMiddleware, shiftController.updateShift);

// DELETE /api/shifts/:id - Delete shift (admin only)
router.delete('/:id', authMiddleware, shiftController.deleteShift);

module.exports = router;
