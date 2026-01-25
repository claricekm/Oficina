/**
 * MODELO DE AGENDAMENTO (Schema)
 * * A coleção central do sistema.
 * * Liga todas as peças: Quem (Customer) vai a Onde (Workshop),
 * * Com o quê (Vehicle), Fazer o quê (Service) e Quando (Dates).
 * * @module models/Booking
 */

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  // --- RELACIONAMENTOS ---
  
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
    default: null // Pode ser atribuído depois pelo Admin
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

  // --- DADOS TEMPORAIS ---
  
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },

  // --- ESTADO DO SERVIÇO ---
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },

  notes: { type: String },

  // --- AUTOMAÇÃO (Job Cron / Polling) ---
  // Usado para saber se o serviço foi fechado automaticamente pelo sistema
  // após passar a hora de término.
  autoCompleted: {
    type: Boolean,
    default: false
  },
  autoCompletedAt: {
    type: Date,
    default: null
  },

  // --- GESTÃO FINANCEIRA ---
  // Campos necessários para o paymentController
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
}, { timestamps: true }); // Cria automaticamente createdAt e updatedAt

module.exports = mongoose.model('Booking', BookingSchema);