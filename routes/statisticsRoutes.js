/**
 * ROTAS DE ESTATÍSTICAS E GESTÃO (Statistics Routes)
 * * Endpoint exclusivo para o Painel de Administração (Dashboard).
 * * Fornece KPIs (Key Performance Indicators) e ferramentas de gestão de staff.
 * * Todas as rotas são estritamente protegidas (apenas Admin).
 * * @module routes/statisticsRoutes
 */

const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/rbacMiddleware');

console.log('✅ statisticsRoutes.js carregado');

/**
 * DASHBOARD KPIS
 * * GET /api/statistics/dashboard
 * * Retorna números gerais: Total de Faturação, Agendamentos Pendentes,
 * * Top Serviços mais vendidos, etc.
 */
router.get('/dashboard', authMiddleware, adminOnly, statisticsController.getDashboardStats);

/**
 * LISTAR MECÂNICOS
 * * GET /api/statistics/mechanics
 * * Retorna a lista de funcionários para gestão no painel de admin.
 * * (Diferente da rota de 'disponibilidade', esta traz dados de perfil).
 */
router.get('/mechanics', authMiddleware, adminOnly, statisticsController.getMechanics);

/**
 * ELIMINAR MECÂNICO
 * * DELETE /api/statistics/mechanics/:id
 * * Remove um funcionário do sistema.
 * * Nota: O controlador deve tratar as dependências (turnos, agendamentos futuros).
 */
router.delete('/mechanics/:id', authMiddleware, adminOnly, statisticsController.deleteMechanic);

module.exports = router;