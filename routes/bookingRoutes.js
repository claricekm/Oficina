/**
 * ROTAS DE AGENDAMENTOS (Booking Routes)
 * * Define os endpoints para gestão de marcações.
 * * Aplica camadas de segurança: Autenticação (Quem és?) e Autorização (O que podes fazer?).
 * * @module routes/bookingRoutes
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const workshopController = require('../controllers/workshopController');
// Importação dos guardas de rota (RBAC) para segurança granular
const { 
  customerOnly, 
  adminOnly, 
  adminOrMechanic, 
  adminOrCustomer 
} = require('../middleware/rbacMiddleware');

console.log('✅ bookingRoutes.js carregado');

// --- ROTAS PÚBLICAS / UTILITÁRIAS ---

/**
 * VERIFICAR DISPONIBILIDADE
 * * POST /api/bookings/check-availability
 * * Verifica slots livres sem criar reserva.
 * * Nota: Deve vir ANTES das rotas com :id para não confundir o Express.
 */
router.post('/check-availability', bookingController.checkAvailability);

// --- ROTAS DE GESTÃO (Admin) ---

/**
 * DISPONIBILIDADE DOS MECÂNICOS
 * * GET /api/bookings/mechanics-availability
 * * Retorna horas semanais de cada mecânico para ajudar na atribuição.
 */
router.get('/mechanics-availability', authMiddleware, adminOnly, bookingController.getMechanicsAvailability);

// --- ROTAS DE UTILIDADE (Cliente) ---

/**
 * POLLING DE CONCLUSÃO
 * * GET /api/bookings/recently-completed
 * * Endpoint leve para a App verificar se o carro ficou pronto.
 */
router.get('/recently-completed', authMiddleware, bookingController.getRecentlyCompletedBookings);

// --- ROTAS CRUD ---

/**
 * LISTAR AGENDAMENTOS
 * * GET /api/bookings
 * * O controlador filtra automaticamente: Cliente vê os seus, Admin vê todos.
 */
router.get('/', authMiddleware, bookingController.getBookings);

/**
 * DETALHES DO AGENDAMENTO
 * * GET /api/bookings/:id
 */
router.get('/:id', authMiddleware, bookingController.getBooking);

/**
 * CRIAR AGENDAMENTO
 * * POST /api/bookings
 * * Apenas clientes podem iniciar um pedido de serviço.
 */
router.post('/', authMiddleware, customerOnly, bookingController.createBooking);

/**
 * ATUALIZAR STATUS
 * * PUT /api/bookings/:id/status
 * * Mecânicos atualizam o progresso (pending -> in_progress -> completed).
 */
router.put('/:id/status', authMiddleware, adminOrMechanic, bookingController.updateBookingStatus);

/**
 * CANCELAR AGENDAMENTO
 * * PUT /api/bookings/:id/cancel
 * * Clientes cancelam os seus, Admin cancela qualquer um.
 */
router.put('/:id/cancel', authMiddleware, adminOrCustomer, bookingController.cancelBooking);

/**
 * ATRIBUIR MECÂNICO
 * * PUT /api/bookings/:id/assign
 * * Apenas Admin pode decidir quem faz o serviço.
 */
router.put('/:id/assign', authMiddleware, adminOnly, bookingController.assignMechanic);

/**
 * ROTA DE COMPATIBILIDADE
 * O Frontend procura os serviços aqui, então redirecionamos para o controller de workshops.
 */
router.get('/:id/services', workshopController.getWorkshopServices);

module.exports = router;