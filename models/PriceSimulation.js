const mongoose = require('mongoose');

const PriceSimulationSchema = new mongoose.Schema({
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },

  customerEmail: { type: String },

  selectedServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],

  estimatedTotal: { type: Number, required: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PriceSimulation', PriceSimulationSchema);
