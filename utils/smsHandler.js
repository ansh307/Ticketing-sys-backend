const {addSmsToQueue} = require("../queues/smsQueue");

function sendBookingConfirmationSMS(data) {
    addSmsToQueue({
        to: data.phone,
        message: `Hi ${data.userName}, your booking for ${data.eventName} on ${data.eventDate} is confirmed. Seats: ${data.seats.join(", ")}. Total: $${data.price}`
    });
}

function sendBookingCancellationSms(data) {
    addSmsToQueue({
        to: data.phone,
        message: `Hi ${data.userName}, your booking for ${data.eventName} on ${data.eventDate} is cancelled successfully. Seats: ${data.seats.join(", ")}. Total: $${data.price}`
    });
}

function sendPaymentSuccessSMS(data) {
    addSmsToQueue({
        to: data.phone,
        message: `Hi ${data.userName}, your payment of $${data.amount} for ${data.eventName} was successful. Payment ID: ${data.paymentId}`
    });
}

async function sendPaymentRefundSMS(data) {
    await addSmsToQueue({
        to: data.phone,
        message: `Hi ${data.userName}, your payment of $${data.amount} for ${data.eventName} was refund successful. Payment ID: ${data.paymentId}`
    });
}

async function sendPaymentFailureSMS(data) {
    await addSmsToQueue({
        to: data.phone,
        message: `Hi ${data.userName}, your payment of $${data.amount} for ${data.eventName} failed. Reason: ${data.failureReason}`
    });
}

module.exports = {
    sendBookingConfirmationSMS,
    sendPaymentSuccessSMS,
    sendPaymentFailureSMS, sendPaymentRefundSMS, sendBookingCancellationSms
};
