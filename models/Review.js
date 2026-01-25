const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
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

  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },

  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },

  visible: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
