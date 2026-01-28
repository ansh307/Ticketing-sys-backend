const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Show = require("../models/Show");
const Movie = require("../models/Movie");
const { successResponse } = require("../utils/responseHandler");
const { delCache } = require("../utils/redisCache");
const logger = require("../utils/logger");
const {
  PAYMENT_STATUS,
  BOOKING_STATUS,
  SEAT_STATUS
} = require("../config/constants");
const {addTicketQueue} = require("../queues/ticketQueue");
const expiryQueue = require("../queues/expiryQueue");



// Fallback to MongoDB search
exports.fallbackToDBSearch = async (req, res) => {
  const { q, language, genre, page = 1, size = 10 } = req.query;
  const skip = (page - 1) * size;

  let query = {};
  
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  if (language) query.language = language;
  if (genre) query.genre = genre;
  query.status = { $in: ['UPCOMING', 'NOW_SHOWING'] };

  const [movies, total] = await Promise.all([
    Movie.find(query)
      .sort({ releaseDate: -1 })
      .skip(skip)
      .limit(parseInt(size)),
    Movie.countDocuments(query)
  ]);

  const pagination = {
    page: parseInt(page),
    size: parseInt(size),
    total,
    pages: Math.ceil(total / size)
  };

  return successResponse(res, 200, 'Movies found (MongoDB fallback)', {
    movies,
    pagination
  });
};

exports.handlePaymentCaptured = async (payload, session) => {
  const paymentEntity = payload.payment.entity;
  
  const payment = await Payment.findOne({
    transactionId: paymentEntity.order_id
  }).session(session);

  if (!payment) {
    logger.error(`Payment not found for order: ${paymentEntity.order_id}`);
    throw new Error("PAYMENT_NOT_FOUND");
  }

  if (payment.status === PAYMENT_STATUS.SUCCESS) {
    logger.info(`Payment already processed: ${paymentEntity.order_id}`);
    return;
  }

  payment.status = PAYMENT_STATUS.SUCCESS;
  payment.transactionId = paymentEntity.id;
  payment.paymentGatewayResponse = paymentEntity;
  await payment.save({ session });

  const booking = await Booking.findById(payment.booking).session(session);
  if (!booking) {
    logger.error(`Booking not found for payment: ${payment._id}`);
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (booking.status !== BOOKING_STATUS.PENDING) {
    logger.warn(`Booking already processed: ${booking._id}`);
    return;
  }

  booking.status = BOOKING_STATUS.CONFIRMED;
  booking.payment = payment._id;
  await booking.save({ session });

  await Seat.updateMany(
    { _id: { $in: booking.seats } },
    { status: SEAT_STATUS.BOOKED },
    { session }
  );

  await Show.findByIdAndUpdate(
    booking.show,
    { $inc: { availableSeats: -booking.seats.length } },
    { session }
  );
  
    await expiryQueue.removeExpiryJob(booking._id);


  logger.info(`Webhook: Payment captured for booking ${booking._id}`);
};

exports.handlePaymentFailed = async (payload, session) => {
  const paymentEntity = payload.payment.entity;
  
  const payment = await Payment.findOne({
    transactionId: paymentEntity.order_id
  }).session(session);

  if (!payment) {
    logger.error(`Payment not found for failed order: ${paymentEntity.order_id}`);
    return; 
  }

  if (payment.status === PAYMENT_STATUS.FAILED) {
    logger.info(`Payment already marked as failed: ${paymentEntity.order_id}`);
    return;
  }

  payment.status = PAYMENT_STATUS.FAILED;
  payment.paymentGatewayResponse = paymentEntity;
  await payment.save({ session });

  const booking = await Booking.findById(payment.booking).session(session);
  if (booking && booking.status === BOOKING_STATUS.PENDING) {
    booking.status = BOOKING_STATUS.FAILED;
    await booking.save({ session });

    await Seat.updateMany(
      { _id: { $in: booking.seats } },
      {
        status: SEAT_STATUS.AVAILABLE,
        lockedBy: null,
        lockedAt: null,
        booking: null
      },
      { session }
    );

    setTimeout(async () => {
      try {
        await Promise.all(
          booking.seats.map(seatId =>
            delCache(`seat_lock:${seatId}`)
          )
        );
      } catch (redisError) {
        logger.error("Redis cleanup error in webhook:", redisError);
      }
    }, 0);
  }

  logger.info(`Webhook: Payment failed for order ${paymentEntity.order_id}`);
};

exports.handleRefundProcessed = async (payload, session) => {
  const refundEntity = payload.refund.entity;

  await Payment.findOneAndUpdate(
    { transactionId: refundEntity.payment_id },
    {
      refundAmount: refundEntity.amount / 100,
      refundDate: new Date(refundEntity.created_at * 1000),
      status: PAYMENT_STATUS.REFUNDED,
      paymentGatewayResponse: refundEntity
    },
    { session }
  );

  logger.info(`Webhook: Refund processed for payment ${refundEntity.payment_id}`);
};



exports.handleSuccessfulPayment = async (payment, razorpay_payment_id, session) => {
  payment.status = PAYMENT_STATUS.SUCCESS;
  payment.transactionId = razorpay_payment_id;
  await payment.save({ session });

  const booking = await Booking.findById(payment.booking).session(session);
  if (!booking) throw new Error("BOOKING_NOT_FOUND");

  if (booking.status !== BOOKING_STATUS.PENDING)
    throw new Error("BOOKING_ALREADY_PROCESSED");

  booking.status = BOOKING_STATUS.CONFIRMED;
  booking.payment = payment._id;
  await booking.save({ session });

  await Seat.updateMany(
    { _id: { $in: booking.seats } },
    {
      status: SEAT_STATUS.BOOKED,
      booking: booking._id,
      lockedBy: null,
      lockedAt: null
    },
    { session }
  );

  await Show.findByIdAndUpdate(
    booking.show,
    { $inc: { availableSeats: -booking.seats.length } },
    { session }
  );

  return booking;
};

exports.handleFailedPayment = async (payment, session) => {
  payment.status = PAYMENT_STATUS.FAILED;
  await payment.save({ session });

  const booking = await Booking.findById(payment.booking).session(session);
  if (booking) {
    booking.status = BOOKING_STATUS.FAILED;
    await booking.save({ session });

    await Seat.updateMany(
      { _id: { $in: booking.seats } },
      {
        status: SEAT_STATUS.AVAILABLE,
        lockedBy: null,
        lockedAt: null,
        booking: null
      },
      { session }
    );
  }
};

exports.cleanupAfterSuccessfulPayment = async (booking) => {
  try {
    await Promise.all(
      booking.seats.map(seatId => delCache(`seat_lock:${seatId}`))
    );

    await addTicketQueue(
      { bookingId: booking._id, attempt: 1 },
      { delay: 1000, attempts: 3 }
    );

    logger.info(`Payment cleanup completed for booking: ${booking._id}`);
  } catch (error) {
    logger.error(`Cleanup error for booking ${booking._id}:`, error);
  }
};

exports.handleVerificationError = async (error, session, paymentData) => {
  try {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    switch (error.message) {
      case "PAYMENT_NOT_FOUND_OR_ALREADY_PROCESSED":
        logger.warn(`Payment already processed: ${paymentData.razorpay_order_id}`);
        break;
      case "PAYMENT_SIGNATURE_INVALID":
        logger.warn(`Invalid signature for: ${paymentData.razorpay_order_id}`);
        break;
      case "BOOKING_ALREADY_PROCESSED":
        logger.warn(`Booking already processed for payment: ${paymentData.razorpay_order_id}`);
        break;
      default:
        logger.error(`Payment verification error: ${error.message}`, {
          orderId: paymentData.razorpay_order_id
        });
    }
  } catch (abortError) {
    logger.error('Error aborting transaction:', abortError);
  }
};
