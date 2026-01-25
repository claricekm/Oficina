const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  brand: { type: String, required: true },
  model: { type: String, required: true },
  licensePlate: { type: String, required: true, unique: true },
  year: { type: Number },
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel', 'electric', 'hybrid', 'lpg'],
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
