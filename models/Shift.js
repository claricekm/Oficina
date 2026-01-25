const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },

  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  date: { type: Date, required: true },

  startTime: { type: String, default: '09:00' },
  endTime: { type: String, default: '17:00' },

  maxBookings: { type: Number, default: 8 }
}, { timestamps: true });

module.exports = mongoose.model('Shift', ShiftSchema);
