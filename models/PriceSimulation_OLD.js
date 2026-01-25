const mongoose = require('mongoose');

const PriceSimulationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  totalDuration: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PriceSimulation', PriceSimulationSchema);
