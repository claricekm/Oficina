/**
 * ROTAS DE PAGAMENTOS (Payment Routes)
 * * Gere o fluxo financeiro da aplicação.
 * * Permite simular pagamentos (Dev) e processar pagamentos reais (Stripe).
 * * @module routes/paymentRoutes
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const { customerOnly } = require('../middleware/rbacMiddleware');

// --- ROTAS TRANSACIONAIS (Apenas Clientes) ---

/**
 * SIMULAR PAGAMENTO (Dev Mode)
 * * POST /api/payments/simulate
 * * Rota usada para fechar a conta manualmente ou em testes.
 * * Não comunica com bancos reais.
 */
router.post(
  '/simulate',
  authMiddleware,
  customerOnly, // Apenas o cliente pode decidir pagar
  paymentController.simulatePayment
);

/**
 * PROCESSAR PAGAMENTO (Stripe)
 * * POST /api/payments/process
 * * Recebe o token do cartão e processa a transação real.
 */
router.post(
  '/process',
  authMiddleware,
  customerOnly,
  paymentController.processPayment
);

// --- ROTAS DE CONSULTA ---

/**
 * VERIFICAR ESTADO DO PAGAMENTO
 * * GET /api/payments/:bookingId/status
 * * Permite saber se uma marcação já está paga.
 * * Acessível a Admins (para conferência) e Clientes (dono da marcação).
 */
router.get(
  '/:bookingId/status',
  authMiddleware,
  paymentController.getPaymentStatus
);

module.exports = router;