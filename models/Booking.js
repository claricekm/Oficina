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

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },

  notes: { type: String },

  // Auto-completion tracking
  autoCompleted: {
    type: Boolean,
    default: false
  },
  autoCompletedAt: {
    type: Date,
    default: null
  },

  // Payment tracking
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
