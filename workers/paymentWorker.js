const paymentQueue = require('../queues/paymentQueue');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Show = require('../models/Show');
const razorpay = require('../config/payment');
const { PAYMENT_STATUS, BOOKING_STATUS, SEAT_STATUS } = require('../config/constants');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

paymentQueue.process(async (job) => {
  try {
    const { paymentId, amount } = job.data;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      logger.error(`Payment worker: Payment not found - ${paymentId}`);
      return errorResponse(null, 404, 'Payment not found in worker');
    }

    const refund = await new Promise((resolve, reject) => {
      razorpay.payments.refund(
        payment.transactionId,
        { amount: amount * 100 },
        (err, refund) => {
          if (err) reject(err);
          else resolve(refund);
        }
      );
    });

    payment.status = PAYMENT_STATUS.REFUNDED;
    payment.refundAmount = amount;
    payment.refundDate = new Date();
    payment.paymentGatewayResponse = refund;
    await payment.save();

    const booking = await Booking.findById(payment.booking);
    booking.status = BOOKING_STATUS.CANCELLED;
    await booking.save();

    await Seat.updateMany(
      { _id: { $in: booking.seats } },
      { status: SEAT_STATUS.AVAILABLE, booking: null, lockedBy: null, lockedAt: null }
    );

    await Show.findByIdAndUpdate(booking.show, { $inc: { availableSeats: booking.seats.length } });

    logger.info(`Refund processed successfully for payment: ${paymentId}`);
    return successResponse(null, 200, 'Refund processed in worker', { paymentId, refund });
  } catch (err) {
    logger.error('Payment worker error:', err);
    throw err;
  }
});
