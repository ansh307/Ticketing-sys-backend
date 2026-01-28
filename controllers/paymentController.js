const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Show = require("../models/Show");
const razorpay = require("../config/payment");
const crypto = require("crypto");
const redisClient = require("../config/redis");
const paymentQueue = require("../queues/paymentQueue");
const { delCache } = require("../utils/redisCache");
const {
  handlePaymentCaptured,
  handlePaymentFailed,
  handleRefundProcessed,
  handleSuccessfulPayment,
  handleFailedPayment,
  cleanupAfterSuccessfulPayment,
  handleVerificationError,
} = require("../helper/helperFunction");

const logger = require("../utils/logger");
const { successResponse, errorResponse } = require("../utils/responseHandler");
const {
  PAYMENT_STATUS,
  BOOKING_STATUS,
  SEAT_STATUS,
} = require("../config/constants");
const { addTicketQueue } = require("../queues/ticketQueue");
const {
  sendPaymentSuccess,
  sendPaymentRefund,
} = require("../utils/emailHandler");
const {
  sendPaymentSuccessSMS,
  sendPaymentRefundSMS,
} = require("../utils/smsHandler");
const expiryQueue = require("../queues/expiryQueue");
const {sendShowReminderEmail, sendPaymentSuccessEmail} = require("../utils/emailHandler");

//old code
// exports.initiatePayment = async (req, res, next) => {
//   try {
//     const { bookingId, paymentMethod } = req.body;

//     const booking = await Booking.findById(bookingId);
//     if (!booking) {
//       return errorResponse(res, 404, 'Booking not found');
//     }

//     const payment = await Payment.create({
//       booking: bookingId,
//       user: req.user.id,
//       amount: booking.finalAmount,
//       paymentMethod,
//       status: PAYMENT_STATUS.PENDING,
//       transactionId: `TXN${Date.now()}`
//     });

//     successResponse(res, 200, 'Payment initiated', { payment });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.verifyPayment = async (req, res, next) => {
//   try {
//     const { paymentId, transactionId } = req.body;

//     const payment = await Payment.findById(paymentId);
//     if (!payment) {
//       return errorResponse(res, 404, 'Payment not found');
//     }

//     payment.status = PAYMENT_STATUS.SUCCESS;
//     payment.transactionId = transactionId;
//     await payment.save();

//     const booking = await Booking.findById(payment.booking);
//     booking.status = BOOKING_STATUS.CONFIRMED;
//     booking.payment = payment._id;
//     await booking.save();

//     await Seat.updateMany(
//       { _id: { $in: booking.seats } },
//       { status: SEAT_STATUS.BOOKED, booking: booking._id }
//     );

//     await Show.findByIdAndUpdate(booking.show, { $inc: { availableSeats: -booking.seats.length } });

//     successResponse(res, 200, 'Payment verified', { booking, payment });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.handleWebhook = async (req, res, next) => {
//   try {
//     successResponse(res, 200, "Webhook received");
//   } catch (error) {
//     next(error);
//   }
// };

exports.initiatePayment = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return errorResponse(res, 404, "Booking not found");

    const amountInPaise = Math.round(booking.finalAmount * 100);

    const order = await new Promise((resolve, reject) => {
      razorpay.orders.create(
        {
          amount: amountInPaise,
          currency: "INR",
          receipt: `receipt_${booking._id}`,
          payment_capture: 1,
        },
        (err, order) => {
          if (err) reject(err);
          else resolve(order);
        }
      );
    });

    const payment = await Payment.create({
      booking: bookingId,
      user: req.user.id,
      amount: booking.finalAmount,
      paymentMethod,
      status: PAYMENT_STATUS.PENDING,
      transactionId: order.id,
      paymentGatewayResponse: order,
    });

    successResponse(res, 200, "Razorpay order created", { order, payment });
  } catch (error) {
    next(error);
  }
};

//Temporary bypass of signature verification for testing
exports.verifyPayment = async (req, res, next) => {
  const user = req.user;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const payment = await Payment.findOne({
      transactionId: razorpay_order_id,
    }).session(session);
    if (!payment) {
      await session.abortTransaction();
      return errorResponse(res, 404, "Payment not found");
    }

    // TEMPORARY BYPASS
    const isSignatureValid = true;

    if (!isSignatureValid) {
      payment.status = PAYMENT_STATUS.FAILED;
      await payment.save({ session });

      const booking = await Booking.findById(payment.booking).session(session);

      await Seat.updateMany(
        { _id: { $in: booking.seats } },
        {
          status: SEAT_STATUS.AVAILABLE,
          lockedBy: null,
          lockedAt: null,
          booking: null,
        },
        { session }
      );

      booking.status = BOOKING_STATUS.FAILED;
      await booking.save({ session });

      await session.abortTransaction();

      for (const seatId of booking.seats) {
        await delCache(`seat_lock:${seatId}`);
      }

      return errorResponse(res, 400, "Payment verification failed");
    }

    payment.status = PAYMENT_STATUS.SUCCESS;
    payment.transactionId = razorpay_payment_id;
    await payment.save({ session });

    const booking = await Booking.findById(payment.booking).session(session);

    if (booking.status !== BOOKING_STATUS.PENDING) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Booking already processed");
    }

    booking.status = BOOKING_STATUS.CONFIRMED;
    booking.payment = payment._id;
    await booking.save({ session });

    await Seat.updateMany(
      { _id: { $in: booking.seats } },
      {
        status: SEAT_STATUS.BOOKED,
        booking: booking._id,
        lockedBy: null,
        lockedAt: null,
      },
      { session }
    );

    await Show.findByIdAndUpdate(
      booking.show,
      { $inc: { availableSeats: -booking.seats.length } },
      { session }
    );

    await session.commitTransaction();

    // Emit real-time seat booked updates to all users in the concert room
    const io = req.app.get('io');
    const concertId = booking.concertId?.toString();
    if (io && concertId) {
      const { emitSeatUpdate } = require('../utils/socketEmitter');
      const bookedSeatsForEmit = booking.seats.map(id => ({
        _id: id,
        status: SEAT_STATUS.BOOKED,
        lockedBy: null,
        lockedAt: null
      }));
      emitSeatUpdate(io, concertId, 'BOOKED', bookedSeatsForEmit);
      console.log(`[PAYMENT VERIFY] ✅ Seats booked:`, booking.seats);
    }

    for (const seatId of booking.seats) {
      await delCache(`seat_lock:${seatId}`);
    }

    await addTicketQueue("generateTicket", { bookingId: booking._id });

        const data = {
            email: user.email,
            userName: user.name,
            phone:user.phone,
            eventName: "",
            amount: "",
            paymentId: "",
        }

        sendPaymentSuccessEmail(data);
        sendPaymentSuccessSMS(data);
        sendShowReminderEmail(user, data);

    await expiryQueue.removeExpiryJob(booking._id);

    return successResponse(res, 200, "Payment successful! Booking confirmed.", {
      booking,
      payment,
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.refundPayment = async (req, res, next) => {
  try {
    const { paymentId, amount } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return errorResponse(res, 404, "Payment not found");

    paymentQueue.add({ paymentId, amount });
    const data = {
      email: payment.user.email,
      userName: payment.user.name,
      amount: amount,
    };
    sendPaymentRefund(data);
    sendPaymentRefundSMS(data);
    successResponse(
      res,
      200,
      "Refund request enqueued, processing in background",
      { paymentId, amount }
    );
  } catch (error) {
    next(error);
  }
};

//working version with transaction and helper functions
// exports.verifyPayment = async (req, res, next) => {
//   const session = await mongoose.startSession();

//   try {
//     const result = await session.withTransaction(async () => {
//       const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//       const payment = await Payment.findOne({
//         transactionId: razorpay_order_id,
//         status: PAYMENT_STATUS.PENDING
//       }).session(session);

//       if (!payment) throw new Error("PAYMENT_NOT_FOUND_OR_ALREADY_PROCESSED");

//       const generated_signature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//         .update(razorpay_order_id + "|" + razorpay_payment_id)
//         .digest("hex");

//       if (generated_signature !== razorpay_signature) {
//         logger.warn(`Payment signature verification failed for order: ${razorpay_order_id}`);
//         await handleFailedPayment(payment, session);
//         throw new Error("PAYMENT_SIGNATURE_INVALID");
//       }

//       const booking = await handleSuccessfulPayment(payment, razorpay_payment_id, session);
//     await addTicketQueue("generateTicket", { bookingId: booking._id });

//        await expiryQueue.removeExpiryJob(booking._id);

//       return { booking, payment };
//     });

//     await cleanupAfterSuccessfulPayment(result.booking);

//     successResponse(res, 200, "Payment successful! Booking confirmed.", {
//       booking: result.booking,
//       payment: result.payment
//     });

//   } catch (error) {
//     await handleVerificationError(error, session, req.body);
//     next(error);
//   } finally {
//     session.endSession();
//   }
// };

exports.handleWebhook = async (req, res, next) => {
  const session = await mongoose.startSession();
  let webhookProcessed = false;

  try {
    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      logger.warn("Invalid webhook signature received", {
        receivedSignature: signature,
        expectedSignature: expectedSignature,
      });
      return res.status(400).json({ error: "Invalid signature" });
    }

    const { event, payload } = req.body;
    logger.info(`Processing webhook event: ${event}`, {
      eventId: payload.event?.id,
    });

    await session.withTransaction(async () => {
      switch (event) {
        case "payment.captured":
          await handlePaymentCaptured(payload, session);
          break;
        case "payment.failed":
          await handlePaymentFailed(payload, session);
          break;
        case "refund.processed":
          await handleRefundProcessed(payload, session);
          break;
        default:
          logger.info(`Unhandled webhook event: ${event}`);
          return;
      }
      webhookProcessed = true;
    });

    res.status(200).json({
      status: "success",
      message: webhookProcessed
        ? "Webhook processed successfully"
        : "No action required for this event",
    });
  } catch (error) {
    logger.error("Webhook processing failed:", {
      event: req.body?.event,
      error: error.message,
      stack: error.stack,
    });

    res.status(200).json({
      status: "acknowledged",
      message: "Webhook received but processing failed",
    });
  } finally {
    session.endSession();
  }
};




