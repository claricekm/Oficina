const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authMiddleware = require('../middleware/authMiddleware');
const { customerOnly } = require('../middleware/rbacMiddleware');

// ==========================================
// Public Routes - Vehicle Data (Cascade Dropdowns)
// ==========================================

// GET /api/vehicles/makes - Get all vehicle makes
router.get('/makes', vehicleController.getVehicleMakes);

// GET /api/vehicles/makes/:make/models - Get models for a specific make
router.get('/makes/:make/models', vehicleController.getVehicleModels);

// GET /api/vehicles/makes/:make/models/:model/fuel-types - Get fuel types for make/model
router.get('/makes/:make/models/:model/fuel-types', vehicleController.getVehicleFuelTypes);

// GET /api/vehicles/fuel-types - Get all fuel types
router.get('/fuel-types', vehicleController.getAllFuelTypes);

// ==========================================
// Protected Routes - Customer Vehicles
// ==========================================

// GET /api/vehicles - Get my vehicles
router.get('/', authMiddleware, customerOnly, vehicleController.getMyVehicles);

// GET /api/vehicles/:id - Get single vehicle
router.get('/:id', authMiddleware, customerOnly, vehicleController.getVehicle);

// POST /api/vehicles - Create vehicle
router.post('/', authMiddleware, customerOnly, vehicleController.createVehicle);

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', authMiddleware, customerOnly, vehicleController.updateVehicle);

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', authMiddleware, customerOnly, vehicleController.deleteVehicle);

module.exports = router;
