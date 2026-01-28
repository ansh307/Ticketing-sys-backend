const { addEmailToQueue } = require("../queues/emailQueue");
const { addSmsToQueue } = require("../queues/smsQueue");

// Send booking confirmation email
function sendBookingConfirmationEmail(data) {
    addEmailToQueue({
        email: data.email,
        type: "BOOKING_CONFIRMATION",
        userName: data.userName,
        eventName: data.eventName,
        eventDate: data.eventDate,
        seats: data.seats,
        price: data.price,
    });
}

function sendPaymentSuccessEmail(data) {
    addEmailToQueue({
        email: data.email,
        type: "Booking Confirmation",
        userName: data.userName,
        eventName: data.eventName,
        amount: data.amount,
        paymentId: data.paymentId,
    });
}


function sendPaymentFailureEmail(data) {
    addEmailToQueue({
        email: data.email,
        type: "PAYMENT_FAILED",
        userName: data.userName,
        eventName: data.eventName,
        amount: data.amount,
        failureReason: data.failureReason,
    });
}

function sendPaymentRefundEmail(data) {
    addEmailToQueue({
        email: data.email,
        type: "PAYMENT_REFUND",
        userName: data.userName,
        eventName: data.eventName,
        amount: data.amount,
        failureReason: data.failureReason,
    });
}

function sendCancellationBookingEmail(data) {
    addEmailToQueue({
        email: data.email,
        type: "Booking Cancellation",
        userName: data.userName,
        eventName: data.eventName,
        amount: data.amount,
        failureReason: data.failureReason,
    });
}

function sendSeatLockReminderEmail(data) {
    addEmailToQueue({
        email: data.email,
        type: "Seat Lock Reminder",
        userName: data.userName,
        eventName: data.eventName,
        theater: data.theater,
        seat: data.seat,
        time: data.time,
    });

}

function sendShowReminderQueueEmail(data) {
    addEmailToQueue({
        email: data.email,
        type: "Show Starting Soon",
        userName: data.userName,
        eventName: data.eventName,
        theaterName: data.theaterName,
        seatNumbers: data.seatNumbers,
        showTime: data.showTime,
        location: data.location
    });

}


module.exports = {
    sendBookingConfirmationEmail, sendShowReminderQueueEmail, sendSeatLockReminderEmail,
    sendPaymentSuccessEmail, sendPaymentRefundEmail,
    sendPaymentFailureEmail, sendCancellationBookingEmail
};
