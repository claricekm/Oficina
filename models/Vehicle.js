/**
 * MODELO DE VEÍCULO (Vehicle Schema)
 * * Representa o carro do cliente.
 * * A matrícula (licensePlate) deve ser única no sistema inteiro.
 * * O tipo de combustível é vital para saber que serviços o carro pode realizar.
 * * @module models/Vehicle
 */

const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  // --- RELACIONAMENTO ---
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // --- CARACTERÍSTICAS ---
  
  brand: { type: String, required: true }, // Ex: BMW
  
  model: { type: String, required: true }, // Ex: Série 1
  
  licensePlate: { 
    type: String, 
    required: true, 
    unique: true // Impede duplicados na base de dados
  },
  
  year: { type: Number },

  // --- MOTORIZAÇÃO ---
  // Importante: Este campo permite à oficina saber se é Elétrico, Diesel, etc.
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel', 'electric', 'hybrid', 'lpg'],
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);