const ticketQueue = require('../queues/ticketQueue');
const Booking = require('../models/Booking');
const { generateQRCode } = require('../utils/qrCodeGenerator');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { addEmailToQueue } = require('../queues/emailQueue');

ticketQueue.process(async (job) => {
  try {
    const { bookingId } = job.data;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      logger.error(`Ticket worker: Booking not found - ${bookingId}`);
      return errorResponse(null, 404, 'Booking not found for ticket generation');
    }

    const qrCode = await generateQRCode({
      bookingId: booking._id,
      userId: booking.user,
      showId: booking.show,
      seats: booking.seats
    });

    booking.qrCode = qrCode;
    await booking.save();

    logger.info(`Ticket generated successfully for booking: ${bookingId}`);
    return successResponse(null, 200, 'Ticket generated in worker', { bookingId });
  } catch (err) {
    logger.error('Ticket worker error:', err);
    throw err;
  }
});
