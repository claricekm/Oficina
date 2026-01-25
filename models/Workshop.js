/**
 * MODELO DE OFICINA (Workshop Schema)
 * * Representa a entidade de negócio físico.
 * * Contém dados vitais para que o cliente encontre a oficina (Cidade, Código Postal)
 * * e dados legais para o funcionamento do negócio (NIF).
 * * @module models/Workshop
 */

const mongoose = require('mongoose');

const WorkshopSchema = new mongoose.Schema({
  // --- IDENTIFICAÇÃO BÁSICA ---
  
  name: { type: String, required: true },
  
  // URL para uma foto da fachada ou logotipo (opcional)
  imageUrl: { type: String, default: null },

  // --- LOCALIZAÇÃO ---
  // Essencial para filtros de pesquisa (ex: procurar oficinas no Porto)
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },

  // --- DADOS FISCAIS E CONTACTO ---
  
  // NIF deve ser único para impedir que a mesma empresa se registe 2 vezes
  nif: { type: String, required: true, unique: true },
  
  contact: { type: String, required: true },

  // --- PROPRIEDADE ---
  // Quem é o Admin responsável por esta oficina?
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // --- REGRAS DE FUNCIONAMENTO ---
  
  // Define o horário de abertura e fecho para o algoritmo de slots
  openingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' }
  },

  // Capacidade de atendimento simultâneo (ex: tem 2 elevadores = 2 slots)
  maxSlotsPerHour: { type: Number, default: 2 }
}, { timestamps: true });

module.exports = mongoose.model('Workshop', WorkshopSchema);