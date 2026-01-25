/**
 * ROTAS DE SERVIÇOS (Service Routes)
 * * Define o "Menu" da oficina (ex: Troca de Óleo, Inspeção).
 * * As leituras são públicas (para o site).
 * * As escritas (Criar/Editar/Apagar) são exclusivas do Admin.
 * * @module routes/serviceRoutes
 */

const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/rbacMiddleware');

console.log('✅ serviceRoutes.js carregado');

// --- ROTAS PÚBLICAS ---

/**
 * LISTAR SERVIÇOS DA OFICINA
 * * GET /api/services/workshop/:workshopId
 * * Usado no Frontend para mostrar o preçário aos clientes.
 */
router.get('/workshop/:workshopId', serviceController.getServicesByWorkshop);

/**
 * DETALHES DO SERVIÇO
 * * GET /api/services/:id
 * * Mostra descrições completas e preço de um serviço específico.
 */
router.get('/:id', serviceController.getService);

// --- ROTAS DE ADMINISTRAÇÃO (Protegidas) ---

/**
 * CRIAR NOVO SERVIÇO
 * * POST /api/services
 * * Adiciona um item ao menu da oficina.
 */
router.post('/', authMiddleware, adminOnly, serviceController.createService);

/**
 * ATUALIZAR SERVIÇO
 * * PUT /api/services/:id
 * * Atualizar preços, descrições ou duração.
 */
router.put('/:id', authMiddleware, adminOnly, serviceController.updateService);

/**
 * REMOVER SERVIÇO (Soft Delete)
 * * DELETE /api/services/:id
 * * Marca o serviço como inativo para não perder histórico.
 */
router.delete('/:id', authMiddleware, adminOnly, serviceController.deleteService);

module.exports = router;