const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nif: { type: String, default: null },
  phone: { type: String, default: null },

  role: {
    type: String,
    enum: ['admin', 'mechanic', 'customer'],
    default: 'customer'
  },

  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    default: null
  },

  vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
