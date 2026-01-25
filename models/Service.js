const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },

  name: { type: String, required: true },
  type: { type: String },
  publicDescription: { type: String },
  privateDescription: {
    type: String,
    select: false  // Only visible to staff (internalNotes per spec)
  },

  durationMinutes: { type: Number, required: true },
  price: { type: Number, required: true },

  // Minimum hours required before booking (default 24 hours)
  minAdvanceTime: {
    type: Number,
    default: 24
  },

  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);
