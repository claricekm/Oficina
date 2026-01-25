const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const { customerOnly, adminOnly, adminOrMechanic, adminOrCustomer } = require('../middleware/rbacMiddleware');

// POST /api/bookings/check-availability - Check available slots (public/customer)
// This route must come BEFORE /:id routes to avoid conflicts
router.post('/check-availability', bookingController.checkAvailability);

// GET /api/bookings/mechanics-availability - Get mechanics with weekly hours (admin only)
// Returns mechanics with their current weekly hours and availability for assignment
router.get('/mechanics-availability', authMiddleware, adminOnly, bookingController.getMechanicsAvailability);

// GET /api/bookings/recently-completed - Get recently completed bookings (customer only)
// Used for polling to trigger review prompts when bookings are auto-completed
router.get('/recently-completed', authMiddleware, bookingController.getRecentlyCompletedBookings);

// GET /api/bookings - Get bookings (filtered by role in controller)
// Customer: only their bookings
// Mechanic: only assigned bookings
// Admin: all workshop bookings
router.get('/', authMiddleware, bookingController.getBookings);

// GET /api/bookings/:id - Get single booking details
// Requires authentication and ownership validation (handled in controller)
router.get('/:id', authMiddleware, bookingController.getBooking);

// POST /api/bookings - Create new booking (customer only)
// Validates vehicle ownership, service availability, and time conflicts
router.post('/', authMiddleware, customerOnly, bookingController.createBooking);

// PUT /api/bookings/:id/status - Update booking status (mechanic or admin)
// Allowed statuses: pending, confirmed, in_progress, completed, cancelled
router.put('/:id/status', authMiddleware, adminOrMechanic, bookingController.updateBookingStatus);

// PUT /api/bookings/:id/cancel - Cancel booking (customer or admin)
// Customer can cancel their own bookings
// Admin can cancel any booking from their workshop
router.put('/:id/cancel', authMiddleware, adminOrCustomer, bookingController.cancelBooking);

// PUT /api/bookings/:id/assign - Assign mechanic to booking (admin only)
// Validates mechanic availability and updates booking status to confirmed
router.put('/:id/assign', authMiddleware, adminOnly, bookingController.assignMechanic);

// ============================================
// BUDGET APPROVAL WORKFLOW ROUTES
// ============================================

// PATCH /api/bookings/:id/set-price - Set final price (mechanic/admin)
// Mechanic sets finalPrice after inspection, status → awaiting_approval
router.patch('/:id/set-price', authMiddleware, adminOrMechanic, bookingController.setPrice);

// PATCH /api/bookings/:id/approve - Approve budget (customer)
// Customer approves the final price, status → approved
router.patch('/:id/approve', authMiddleware, customerOnly, bookingController.approvePrice);

// PATCH /api/bookings/:id/start - Start service (mechanic/admin)
// Mechanic starts work, status → in_progress
router.patch('/:id/start', authMiddleware, adminOrMechanic, bookingController.startService);

// PATCH /api/bookings/:id/complete - Complete service (mechanic/admin)
// Mechanic completes work, status → completed
router.patch('/:id/complete', authMiddleware, adminOrMechanic, bookingController.completeService);

// GET /api/bookings/:id/invoice - Generate invoice (completed bookings only)
// Returns invoice data with VAT calculation
router.get('/:id/invoice', authMiddleware, bookingController.getInvoice);

module.exports = router;
