/**
 * ROTAS DE TURNOS (Shift Routes)
 * * Gere a escala de trabalho dos mecânicos (quem trabalha em que dia).
 * * Vital para o sistema calcular slots disponíveis para clientes.
 * * A gestão (escrita) é exclusiva de Admins.
 * * @module routes/shiftRoutes
 */

const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly, adminOrMechanic } = require('../middleware/rbacMiddleware');

console.log('✅ shiftRoutes.js carregado');

// --- ROTAS DE LEITURA (Staff & Sistema) ---

/**
 * LISTAR TURNOS DA OFICINA
 * * GET /api/shifts/workshop/:workshopId
 * * Retorna o calendário da oficina.
 * * Aberto para permitir que o Frontend calcule disponibilidade geral.
 */
router.get('/workshop/:workshopId', shiftController.getShiftsByWorkshop);

/**
 * LISTAR TURNOS DE UM MECÂNICO
 * * GET /api/shifts/mechanic/:mechanicId
 * * Permite ao mecânico ver a sua própria agenda.
 * * Restrito a Staff (Admin ou Mecânico).
 */
router.get('/mechanic/:mechanicId', authMiddleware, adminOrMechanic, shiftController.getShiftsByMechanic);

/**
 * DETALHES DO TURNO
 * * GET /api/shifts/:id
 */
router.get('/:id', authMiddleware, adminOrMechanic, shiftController.getShift);

// --- ROTAS DE GESTÃO (Admin) ---

/**
 * CRIAR TURNO (Escalar Mecânico)
 * * POST /api/shifts
 * * Define que o Mecânico X trabalha no dia Y das 09:00 às 18:00.
 * * Apenas Admin.
 */
router.post('/', authMiddleware, adminOnly, shiftController.createShift);

/**
 * ATUALIZAR TURNO
 * * PUT /api/shifts/:id
 * * Mudar horários ou capacidade de um turno existente.
 * * Apenas Admin.
 */
router.put('/:id', authMiddleware, adminOnly, shiftController.updateShift);

/**
 * REMOVER TURNO
 * * DELETE /api/shifts/:id
 * * Cancela o dia de trabalho (remove disponibilidade do sistema).
 * * Apenas Admin.
 */
router.delete('/:id', authMiddleware, adminOnly, shiftController.deleteShift);

module.exports = router;