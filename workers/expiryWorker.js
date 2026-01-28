const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Show = require('../models/Show');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');
const { BOOKING_STATUS, SEAT_STATUS } = require('../config/constants');
const redisConfig = require('../config/redis');

const connection = {
  host: redisConfig.host,
  port: redisConfig.port,
  username: redisConfig.username,
  password: redisConfig.password,
}

// Function to delete expired booking
const deleteExpiredBooking = async (bookingId, seatIds, showId) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findById(bookingId).session(session);
      
      if (!booking) {
        logger.info(`Booking already deleted: ${bookingId}`);
        return;
      }

      if (booking.status !== BOOKING_STATUS.PENDING) {
        logger.info(`Booking ${bookingId} already processed, skipping deletion`);
        return;
      }

      logger.info(`Deleting expired booking: ${bookingId}`);

      await Seat.updateMany(
        { _id: { $in: seatIds } },
        { 
          status: SEAT_STATUS.AVAILABLE,
          booking: null,
          lockedBy: null,
          lockedAt: null
        },
        { session }
      );

      await Show.findByIdAndUpdate(
        showId,
        { $inc: { availableSeats: seatIds.length } },
        { session }
      );

      await Booking.findByIdAndDelete(bookingId).session(session);

      await Promise.all(
        seatIds.map(seatId => 
          redisClient.del(`seat_lock:${seatId}`)
        )
      );

      logger.info(`Successfully deleted expired booking: ${bookingId}`);
    });
  } catch (error) {
    logger.error(`Error deleting expired booking ${bookingId}:`, error);
    throw error; 
  } finally {
    session.endSession();
  }
}

const expiryWorker = new Worker('bookingExpiry', async (job) => {
  try {
    const { bookingId, seatIds, showId } = job.data;
    
    logger.info(`Processing expiry job for booking: ${bookingId}`);
    
    await deleteExpiredBooking(bookingId, seatIds, showId);
    
    return { success: true, bookingId };
  } catch (error) {
    logger.error(`Expiry worker error for job ${job.id}:`, error);
    throw error;
  }
}, {
  connection,
  concurrency: 5 // Process 5 jobs concurrently
});

expiryWorker.on('completed', (job) => {
  logger.info(`Expiry job completed: ${job.id} for booking ${job.data.bookingId}`);
});

expiryWorker.on('failed', (job, err) => {
  logger.error(`Expiry job failed: ${job.id}`, err);
});

expiryWorker.on('error', (err) => {
  logger.error('Expiry worker error:', err);
});

module.exports = expiryWorker;