/**
 * MODELO DE AVALIAÇÃO (Review Schema)
 * * Guarda o feedback (estrelas e comentário) deixado pelos clientes.
 * * Relaciona o Cliente, a Oficina e (opcionalmente) a Marcação específica.
 * * @module models/Review
 */

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
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

  // Ligação opcional à marcação.
  // Permite verificar "Compra Verificada" (se o cliente realmente fez o serviço).
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },

  // --- CONTEÚDO DA AVALIAÇÃO ---

  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  
  comment: { 
    type: String 
  },

  // --- MODERAÇÃO ---
  // Permite ao Admin ocultar comentários impróprios sem apagar o registo
  visible: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);