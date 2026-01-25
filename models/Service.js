/**
 * MODELO DE SERVIÇO (Service Schema)
 * * Define os serviços que a oficina presta (o "Menu" da oficina).
 * * Contém preços, duração estimada e descrições.
 * * @module models/Service
 */

const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  // --- RELACIONAMENTO ---
  // A qual oficina este serviço pertence?
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },

  // --- DETALHES DO SERVIÇO ---
  
  name: { type: String, required: true },
  
  // Categoria (ex: 'Manutenção', 'Reparação', 'Limpeza')
  type: { type: String },

  // O que o cliente vê no site/app
  publicDescription: { type: String },
  
  // Notas internas para os mecânicos (ex: "Usar óleo 5W30")
  privateDescription: { type: String },

  // --- CÁLCULO DE CUSTOS E TEMPO ---
  
  // Usado para calcular a agenda do mecânico
  durationMinutes: { type: Number, required: true },
  
  // Preço base
  price: { type: Number, required: true },

  // --- ESTADO ---
  // Soft Delete: Se false, o serviço não aparece para novos agendamentos,
  // mas mantém o histórico de agendamentos antigos.
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);