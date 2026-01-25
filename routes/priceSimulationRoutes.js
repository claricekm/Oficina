/**
 * ROTAS DE SIMULAÇÃO DE PREÇOS (Price Simulation Routes)
 * * Permite aos clientes calcular orçamentos sem compromisso.
 * * Permite aos administradores ver o que os clientes andam a pesquisar (Leads).
 * * @module routes/priceSimulationRoutes
 */

const express = require('express');
const router = express.Router();
const priceSimulationController = require('../controllers/priceSimulationController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas as rotas exigem login para guardar o histórico no perfil do utilizador
console.log('✅ priceSimulationRoutes.js carregado');

/**
 * MEUS ORÇAMENTOS
 * * GET /api/simulations/my
 * * Lista o histórico de simulações do cliente logado.
 */
router.get('/my', authMiddleware, priceSimulationController.getMySimulations);

/**
 * ORÇAMENTOS DA OFICINA (Admin)
 * * GET /api/simulations/workshop/:workshopId
 * * O Admin pode ver todas as simulações feitas para a sua oficina.
 * * Útil para análise de mercado e contacto com clientes interessados.
 */
router.get('/workshop/:workshopId', authMiddleware, priceSimulationController.getSimulationsByWorkshop);

/**
 * DETALHES DO ORÇAMENTO
 * * GET /api/simulations/:id
 */
router.get('/:id', authMiddleware, priceSimulationController.getSimulation);

/**
 * CRIAR NOVA SIMULAÇÃO
 * * POST /api/simulations
 * * Recebe lista de serviços e retorna o total calculado.
 */
router.post('/', authMiddleware, priceSimulationController.createSimulation);

/**
 * APAGAR SIMULAÇÃO
 * * DELETE /api/simulations/:id
 * * Permite ao cliente limpar o seu histórico.
 */
router.delete('/:id', authMiddleware, priceSimulationController.deleteSimulation);

module.exports = router;