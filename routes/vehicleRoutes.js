const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes are protected (need login)

// GET /api/vehicles - Get my vehicles
router.get('/', authMiddleware, vehicleController.getMyVehicles);

// GET /api/vehicles/:id - Get single vehicle
router.get('/:id', authMiddleware, vehicleController.getVehicle);

// POST /api/vehicles - Create vehicle
router.post('/', authMiddleware, vehicleController.createVehicle);

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', authMiddleware, vehicleController.updateVehicle);

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', authMiddleware, vehicleController.deleteVehicle);

module.exports = router;
