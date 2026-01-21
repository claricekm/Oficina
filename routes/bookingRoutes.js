const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/bookings/check-availability - Check available slots (public/customer)
// This route must come BEFORE /:id routes to avoid conflicts
router.post('/check-availability', bookingController.checkAvailability);

// GET /api/bookings - Get bookings (filtered by role)
// Customer: only their bookings
// Mechanic: only assigned bookings
// Admin: all workshop bookings
router.get('/', authMiddleware, bookingController.getBookings);

// GET /api/bookings/:id - Get single booking details
// Requires authentication and ownership validation
router.get('/:id', authMiddleware, bookingController.getBooking);

// POST /api/bookings - Create new booking (customer only)
// Validates vehicle ownership, service availability, and time conflicts
router.post('/', authMiddleware, bookingController.createBooking);

// PUT /api/bookings/:id/status - Update booking status (mechanic/admin)
// Allowed statuses: pending, confirmed, in_progress, completed, cancelled
router.put('/:id/status', authMiddleware, bookingController.updateBookingStatus);

// PUT /api/bookings/:id/cancel - Cancel booking (customer/admin)
// Customer can cancel their own bookings
// Admin can cancel any booking from their workshop
router.put('/:id/cancel', authMiddleware, bookingController.cancelBooking);

// PUT /api/bookings/:id/assign - Assign mechanic to booking (admin only)
// Validates mechanic availability and updates booking status to confirmed
router.put('/:id/assign', authMiddleware, bookingController.assignMechanic);

module.exports = router;
