const { generateQRCode } = require('../utils/qrCodeGenerator');
const mongoose = require("mongoose");
const { BOOKING_STATUS, SEAT_STATUS, PAYMENT_STATUS } = require("../config/constants");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const { sendPaymentSuccessEmail } = require("../utils/emailHandler");
const { sendBookingConfirmationSMS } = require("../utils/smsHandler");
const { sendShowTimeReminder } = require('../queues/reminderQueue');
const Concert = require('../models/Concert');
const User = require('../models/User');
const { seatioClient } = require('../config/seatio');
const Payment = require('../models/Payment');

exports.confirmBookingAfterPayment = async (body) => {

    let { userId, totalAmount, paymentMethod, productName, concertId, eventKey, seatLabels, paymentId, paymentIntent } = body;

    const seatLabelsParsed = JSON.parse(seatLabels);
    const seatIds = seatLabelsParsed.map(s => s.seatId);

    const session = await mongoose.startSession();
    session.startTransaction();

    let createdBooking;

    try {
        try {

            await seatioClient.events.book(eventKey, seatIds);
        } catch (err) {
            console.error("Seats.io booking failed:", err);
            throw err; // rethrow to abort transaction
        }


        const bookingId = `BK-${concertId.substring(0, 4)}-${Date.now()}`;


        const bookingData = {
            bookingId,
            user: userId,
            concertId,
            seats: seatLabelsParsed,
            totalAmount,
            finalAmount: totalAmount,
            status: BOOKING_STATUS.CONFIRMED,
        };

        const [booking] = await Booking.create([bookingData], { session });

        if (!booking) {
            throw new Error("Failed to create booking document.");
        }

        const payment = await Payment.create([{
            booking: booking._id,
            user: userId,
            amount: totalAmount,
            paymentMethod,
            status: PAYMENT_STATUS.SUCCESS,
            transactionId: paymentId,
            paymentGatewayResponse: paymentIntent
        }], { session });

        booking.payment = payment._id;

        const qrCode = await generateQRCode({
            bookingId,
            userId,
            concertId,
            seats: seatLabelsParsed
        });


        booking.qrCode = qrCode;
        await booking.save({ session });

        await session.commitTransaction();
        session.endSession();

    } catch (err) {
        try {
            await session.abortTransaction();
        } catch (abortErr) {

            console.error("Failed to abort transaction (likely already committed):", abortErr.message);
        }
        session.endSession();

        console.log("↩️ Transaction process concluded (rolled back or failed to abort committed session).");
        throw err;
    }

    const concertDetail = await Concert.findById(concertId).populate("theaterId");
    const userDetail = await User.findById(userId);


    try {
        sendPaymentSuccessEmail({
            email: userDetail.email,
            type: "Booking Confirmation",
            userName: userDetail.name,
            eventName: productName || "ticket",
            amount: totalAmount,
            paymentId,
        });

        console.log("✔️ Payment success email sent.");
    } catch (emailErr) {
        console.error(" Failed to send payment success email:", emailErr.message);
    }


    try {

        sendBookingConfirmationSMS(userPhone || "+916398239247");
        console.log("✔️ Booking confirmation SMS sent.");
    } catch (smsErr) {
        console.error(" Failed to send booking confirmation SMS:", smsErr.message);
    }


    try {
        sendShowTimeReminder({
            email,
            userName: userDetail.name,
            eventName: concertDetail?.title || "ticket",
            theaterName: concertDetail?.theaterId?.name || "Theater",
            seatNumbers: seatIds.join(","),
            showTime: concertDetail?.startTime,
            location: concertDetail?.theaterId?.location
        });

    } catch (error) {
        console.error("Failed to send booking confirmation SMS:", error.message);
    }


    return createdBooking;
};