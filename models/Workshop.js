const mongoose = require('mongoose');

const WorkshopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  nif: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  imageUrl: { type: String, default: null },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  openingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' }
  },

  maxSlotsPerHour: { type: Number, default: 2 }
}, { timestamps: true });

module.exports = mongoose.model('Workshop', WorkshopSchema);
