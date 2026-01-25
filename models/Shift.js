/**
 * MODELO DE TURNO (Shift Schema)
 * * Define a escala de trabalho de um mecânico num dia específico.
 * * Usado pelo sistema para calcular a disponibilidade de horários.
 * * @module models/Shift
 */

const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  // --- RELACIONAMENTOS ---

  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },

  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // O mecânico é um User com role="mechanic"
    required: true
  },

  // --- ESCALA ---

  date: { 
    type: Date, 
    required: true 
  },

  // Horários guardados como String para facilitar (ex: "09:00")
  startTime: { 
    type: String, 
    default: '09:00' 
  },
  
  endTime: { 
    type: String, 
    default: '17:00' 
  },

  // Capacidade máxima de carros que este mecânico aguenta neste dia.
  // Útil para limitar carga de trabalho independentemente das horas.
  maxBookings: { 
    type: Number, 
    default: 8 
  }
}, { timestamps: true });

module.exports = mongoose.model('Shift', ShiftSchema);