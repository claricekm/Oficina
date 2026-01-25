/**
 * SERVIÇO DE AGENDAMENTO (Scheduler Service)
 * * Gere tarefas automáticas em background (Cron Jobs).
 * * Principal função: Fechar marcações antigas para garantir que o histórico
 * * fica coerente, mesmo que o mecânico se esqueça de clicar em "Concluir".
 * * @module services/schedulerService
 */

const cron = require('node-cron');
const Booking = require('../models/Booking');

/**
 * FECHAR AUTOMATICAMENTE AGENDAMENTOS EXPIRADOS
 * * Procura na base de dados serviços que já passaram da hora de fim (endTime < now)
 * * e que ainda estão abertos ('confirmed' ou 'in_progress').
 * * Marca-os como 'completed' e adiciona uma flag 'autoCompleted: true'.
 * * @returns Número de documentos modificados
 */
const autoCompleteExpiredBookings = async () => {
  const now = new Date();

  try {
    // Atualização em massa (Bulk Update) para eficiência
    const result = await Booking.updateMany(
      {
        status: { $in: ['confirmed', 'in_progress'] },
        endTime: { $lte: now } // Menor ou igual a agora
      },
      {
        $set: {
          status: 'completed',
          autoCompleted: true, // Flag para saber que foi o bot a fechar
          autoCompletedAt: now
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Scheduler] Auto-completed ${result.modifiedCount} booking(s) at ${now.toISOString()}`);
    }

    return result.modifiedCount;
  } catch (error) {
    console.error('[Scheduler] Error auto-completing bookings:', error);
    return 0;
  }
};

/**
 * INICIALIZAR AGENDADOR
 * * Configura o cron job para correr a cada 5 minutos.
 * * Também corre uma vez imediatamente ao iniciar o servidor
 * * (para apanhar serviços que expiraram enquanto o servidor estava desligado).
 */
const initScheduler = () => {
  // Sintaxe Cron: */5 * * * * = "A cada 5 minutos"
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Scheduler] Running auto-completion check...');
    await autoCompleteExpiredBookings();
  });

  console.log('[Scheduler] Booking auto-completion scheduler initialized (runs every 5 minutes)');

  // Execução imediata no arranque
  autoCompleteExpiredBookings();
};

module.exports = {
  initScheduler,
  autoCompleteExpiredBookings
};