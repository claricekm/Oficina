/**
 * MODELO DE SIMULAÇÃO DE PREÇO (Price Simulation Schema)
 * * Guarda o registo de orçamentos/simulações feitos pelos clientes.
 * * Diferente de uma 'Booking' (Marcação), isto é apenas um cálculo prévio.
 * * Importante para análise de dados (saber o que os clientes procuram).
 * * @module models/PriceSimulation
 */

const mongoose = require('mongoose');

const PriceSimulationSchema = new mongoose.Schema({
  // --- RELACIONAMENTOS ---

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

  // O veículo é opcional na simulação (o cliente pode estar apenas a ver preços
  // antes de cadastrar o carro)
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },

  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  }],

  // --- DADOS DO CÁLCULO ---
  // Guardamos o preço total calculado no momento da simulação.
  // Isto é importante porque se o preço do serviço mudar no futuro,
  // o histórico desta simulação mantém o valor original que o cliente viu.
  totalPrice: {
    type: Number,
    required: true
  },

  totalDuration: {
    type: Number,
    required: true
  }
}, {
  timestamps: true // Cria createdAt e updatedAt automaticamente
});

module.exports = mongoose.model('PriceSimulation', PriceSimulationSchema);