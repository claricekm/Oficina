const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },

  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },

  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },

  // Status with budget approval workflow
  // Flow: pending → awaiting_approval → approved → in_progress → completed
  // Legacy flow still works: pending → confirmed → in_progress → completed
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'awaiting_approval', 'approved', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },

  // Price fields for budget approval workflow
  estimatedPrice: {
    type: Number,
    default: null  // Set from service.price when booking is created
  },
  finalPrice: {
    type: Number,
    default: null  // Set by mechanic after inspection
  },

  // Customer and mechanic notes
  notes: { type: String },  // General notes (legacy)
  customerNotes: { type: String },  // Customer's notes when booking
  mechanicNotes: {
    type: String,
    select: false  // Only visible to staff
  },

  // Timestamps for state transitions
  approvedAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },

  // Auto-completion tracking
  autoCompleted: {
    type: Boolean,
    default: false
  },
  autoCompletedAt: {
    type: Date,
    default: null
  },

  // Cancellation tracking
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    enum: ['customer_request', 'price_rejected', 'schedule_conflict', 'admin_decision', 'other'],
    default: null
  },
  cancellationNotes: {
    type: String,
    default: null
  },

  // Payment tracking

  paid: {
    type: Boolean,
    default: false
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'mbway', 'multibanco', 'simulated'],
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  customerNif: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
