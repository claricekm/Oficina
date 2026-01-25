/**
 * ROTAS DE OFICINAS (Workshop Routes)
 * * Gere a visualização e edição dos dados da oficina.
 * * As rotas de leitura são públicas (para a pesquisa de oficinas na Homepage).
 * * A rota de edição é protegida e exclusiva para o Admin daquela oficina.
 * * @module routes/workshopRoutes
 */

const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/rbacMiddleware');

console.log('✅ workshopRoutes.js carregado');

// --- ROTAS PÚBLICAS ---

/**
 * LISTAR TODAS AS OFICINAS
 * * GET /api/workshops
 * * Usado na Homepage ou página de pesquisa.
 * * Aceita query params (ex: ?city=Viseu) se implementado no controller.
 */
router.get('/', workshopController.getAllWorkshops);

/**
 * DETALHES DA OFICINA
 * * GET /api/workshops/:id
 * * Retorna morada, contacto, horário e imagem.
 */
router.get('/:id', workshopController.getWorkshop);

/**
 * LISTAR SERVIÇOS DA OFICINA
 * * GET /api/workshops/:id/services
 * * Atalho conveniente para obter o "Menu" de uma oficina específica.
 */
router.get('/:id/services', workshopController.getWorkshopServices);

// --- ROTAS DE GESTÃO (Admin) ---

/**
 * ATUALIZAR DADOS DA OFICINA
 * * PUT /api/workshops/:id
 * * Alterar nome, morada, horário ou capacidade de slots.
 * * O controlador verifica se o Admin logado é realmente o dono desta oficina.
 */
router.put('/:id', authMiddleware, adminOnly, workshopController.updateWorkshop);

module.exports = router;