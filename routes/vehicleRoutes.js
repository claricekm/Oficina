/**
 * ROTAS DE VEÍCULOS (Vehicle Routes)
 * * Divide-se em duas partes:
 * * 1. Dados Estáticos (Público): Fornece listas de Marcas/Modelos para formulários.
 * * 2. Gestão de Veículos (Protegido): CRUD dos carros do próprio cliente.
 * * @module routes/vehicleRoutes
 */

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authMiddleware = require('../middleware/authMiddleware');
const { customerOnly } = require('../middleware/rbacMiddleware');

console.log('✅ vehicleRoutes.js carregado');

// ==========================================
// 1. ROTAS DE DADOS ESTÁTICOS (Dropdowns em Cascata)
// ==========================================
// Estas rotas não requerem login, pois são dados genéricos do mercado.

/**
 * LISTAR MARCAS
 * * GET /api/vehicles/makes
 * * Retorna: ['Audi', 'BMW', 'Renault', ...]
 */
router.get('/makes', vehicleController.getVehicleMakes);

/**
 * LISTAR MODELOS DA MARCA
 * * GET /api/vehicles/makes/:make/models
 * * Ex: /api/vehicles/makes/Tesla/models -> Retorna ['Model 3', 'Model Y', ...]
 */
router.get('/makes/:make/models', vehicleController.getVehicleModels);

/**
 * LISTAR COMBUSTÍVEIS DO MODELO
 * * GET /api/vehicles/makes/:make/models/:model/fuel-types
 * * Ex: .../Tesla/models/Model 3/fuel-types -> Retorna apenas 'Elétrico'
 */
router.get('/makes/:make/models/:model/fuel-types', vehicleController.getVehicleFuelTypes);

/**
 * LISTAR TODOS OS COMBUSTÍVEIS
 * * GET /api/vehicles/fuel-types
 * * Lista mestre para filtros gerais.
 */
router.get('/fuel-types', vehicleController.getAllFuelTypes);

// ==========================================
// 2. ROTAS DE GESTÃO DO CLIENTE (Meus Veículos)
// ==========================================
// Requerem Autenticação + Role de Cliente

/**
 * LISTAR MEUS VEÍCULOS
 * * GET /api/vehicles
 */
router.get('/', authMiddleware, customerOnly, vehicleController.getMyVehicles);

/**
 * DETALHES DO VEÍCULO
 * * GET /api/vehicles/:id
 */
router.get('/:id', authMiddleware, customerOnly, vehicleController.getVehicle);

/**
 * ADICIONAR VEÍCULO
 * * POST /api/vehicles
 */
router.post('/', authMiddleware, customerOnly, vehicleController.createVehicle);

/**
 * ATUALIZAR VEÍCULO
 * * PUT /api/vehicles/:id
 */
router.put('/:id', authMiddleware, customerOnly, vehicleController.updateVehicle);

/**
 * REMOVER VEÍCULO
 * * DELETE /api/vehicles/:id
 */
router.delete('/:id', authMiddleware, customerOnly, vehicleController.deleteVehicle);

module.exports = router;