const express = require('express');
const router = express.Router();
const priceSimulationController = require('../controllers/priceSimulationController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication

// GET /api/simulations/my - Get my simulations
router.get('/my', authMiddleware, priceSimulationController.getMySimulations);

// GET /api/simulations/workshop/:workshopId - Get simulations by workshop (admin)
router.get('/workshop/:workshopId', authMiddleware, priceSimulationController.getSimulationsByWorkshop);

// GET /api/simulations/:id - Get single simulation
router.get('/:id', authMiddleware, priceSimulationController.getSimulation);

// POST /api/simulations - Create simulation
router.post('/', authMiddleware, priceSimulationController.createSimulation);

// DELETE /api/simulations/:id - Delete simulation
router.delete('/:id', authMiddleware, priceSimulationController.deleteSimulation);

module.exports = router;
