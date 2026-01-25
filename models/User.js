/**
 * MODELO DE UTILIZADOR (User Schema)
 * * A entidade principal de autenticação e perfil.
 * * Gere três tipos de perfis (Roles):
 * * 1. Admin: Dono da oficina.
 * * 2. Mechanic: Funcionário da oficina.
 * * 3. Customer: Cliente final.
 * * @module models/User
 */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // --- DADOS DE LOGIN E PERFIL ---
  
  name: { type: String, required: true },
  
  email: { type: String, required: true, unique: true },
  
  password: { type: String, required: true },

  // Dados fiscais e de contacto (Essenciais para faturação e notificações)
  nif: { type: String, default: null },
  phone: { type: String, default: null },

  // --- PERMISSÕES ---
  
  role: {
    type: String,
    enum: ['admin', 'mechanic', 'customer'],
    default: 'customer'
  },

  // --- RELACIONAMENTOS ---

  // Se for Admin ou Mechanic:
  // Define a qual oficina este utilizador pertence ou trabalha.
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    default: null
  },

  // Se for Customer:
  // Lista de carros que o cliente possui.
  vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);