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
  privateDescription: { type: String },

  durationMinutes: { type: Number, required: true },
  price: { type: Number, required: true },

  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);
