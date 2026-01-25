const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const { customerOnly } = require('../middleware/rbacMiddleware');

// All payment routes require authentication (customer only for now)

// POST /api/payments/simulate - Simulate payment (dev mode)
router.post(
  '/simulate',
  authMiddleware,
  customerOnly,
  paymentController.simulatePayment
);

// POST /api/payments/process - Process payment (Stripe ready)
router.post(
  '/process',
  authMiddleware,
  customerOnly,
  paymentController.processPayment
);

// GET /api/payments/:bookingId/status - Get payment status
router.get(
  '/:bookingId/status',
  authMiddleware,
  paymentController.getPaymentStatus
);

module.exports = router;
