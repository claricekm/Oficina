const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes protected

// GET /api/bookings - Get bookings (filtered by role)
router.get('/', authMiddleware, bookingController.getBookings);

// GET /api/bookings/:id - Get single booking
router.get('/:id', authMiddleware, bookingController.getBooking);

// POST /api/bookings - Create booking (customer)
router.post('/', authMiddleware, bookingController.createBooking);

// PUT /api/bookings/:id/status - Update status (mechanic/admin)
router.put('/:id/status', authMiddleware, bookingController.updateBookingStatus);

// PUT /api/bookings/:id/cancel - Cancel booking (customer/admin)
router.put('/:id/cancel', authMiddleware, bookingController.cancelBooking);

// PUT /api/bookings/:id/assign - Assign mechanic (admin only)
router.put('/:id/assign', authMiddleware, bookingController.assignMechanic);

module.exports = router;
