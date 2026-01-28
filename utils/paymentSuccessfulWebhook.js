
const { BOOKING_STATUS, SEAT_STATUS } = require("../config/constants");

const Booking = require("../models/Booking");

const { sendPaymentSuccessEmail } = require("./emailHandler");
const { sendBookingConfirmationSMS } = require("./smsHandler");

const paymentSuccessfulWebhook = async (val) => {
    try {
        const bookingId = val.metadata?.bookingId;
        if (!bookingId) return console.error("No bookingId in payment metadata");

        const booking = await Booking.findById(bookingId).populate("seats user");
        if (!booking) return console.error("Booking not found for payment");

        if (booking.status === BOOKING_STATUS.CONFIRMED) {
            console.log("Booking already confirmed");
            return;
        }

        // 1️ Update booking status
        booking.status = BOOKING_STATUS.CONFIRMED;
        await booking.save();

        // 2️ Update seats to BOOKED
        await Seat.updateMany(
            { _id: { $in: booking.seats.map(s => s._id) } },
            { status: SEAT_STATUS.BOOKED }
        );

        // 3Send email & SMS
        const data = {
            email: booking.user.email || "ayushnegi1912@gmail.com",
            type: "Payment Successful",
            userName: booking.user.name || "Ayush Negi",
            bookingId: booking.bookingId,
            seats: booking.seats.map(s => s.seatNumber).join(", "),
            totalAmount: booking.finalAmount
        };

        sendPaymentSuccessEmail(data);
        sendBookingConfirmationSMS(booking.user.phone || "+916398239247");

        console.log(`Booking ${booking.bookingId} confirmed successfully`);
    } catch (err) {
        console.error("Error in paymentSuccessfulWebhook:", err);
    }
};

module.exports = { paymentSuccessfulWebhook };
