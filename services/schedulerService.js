const cron = require('node-cron');
const Booking = require('../models/Booking');

/**
 * Scheduler Service
 * Handles automatic completion of bookings when their end time has passed
 */

// Auto-complete bookings where endTime < now and status is confirmed or in_progress
const autoCompleteExpiredBookings = async () => {
  const now = new Date();

  try {
    const result = await Booking.updateMany(
      {
        status: { $in: ['confirmed', 'in_progress'] },
        endTime: { $lte: now }
      },
      {
        $set: {
          status: 'completed',
          autoCompleted: true,
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

// Initialize the scheduler
const initScheduler = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Scheduler] Running auto-completion check...');
    await autoCompleteExpiredBookings();
  });

  console.log('[Scheduler] Booking auto-completion scheduler initialized (runs every 5 minutes)');

  // Run once immediately on startup
  autoCompleteExpiredBookings();
};

module.exports = {
  initScheduler,
  autoCompleteExpiredBookings
};
