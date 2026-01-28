// routes/webhook.js
const express = require("express");
const Stripe = require("stripe");
const { confirmBookingAfterPayment } = require("../services/bookingService");

const webhookRoute = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const webhookHandler = async (req, res) => {
    let event;
    const signature = req.headers["stripe-signature"];

    try {
        if (endpointSecret) {
            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                endpointSecret
            );
        } else {
            event = req.body;
        }
    } catch (err) {
        console.error(" Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            const concertId = session.metadata.concertId;
            const seatIds = JSON.parse(session.metadata.seatIds);
            const userId = session.metadata.userId;
            const amount = session.amount_total / 100;


            try {
                const booking = await confirmBookingAfterPayment({
                    userId,
                    concertId,
                    seatLabels,
                    amount,
                    productName,
                    eventKey,
                    paymentId: session.id
                });

                

                console.log("🎫 Booking Confirmed:", booking._id);

            } catch (error) {
                console.log("❌ Failed to confirm booking", error);
            }


            break;
        }
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object;

            console.log(
                `✅ PaymentIntent for ₹${paymentIntent.amount / 100} succeeded.`
            );
            break;
        }

        case "payment_method.attached": {
            const paymentMethod = event.data.object;
            console.log("💳 PaymentMethod attached:", paymentMethod.id);
            break;
        }

        default:
            console.log(`Unhandled event type ${event.type}.`);
    }

    res.status(200).send(); // Acknowledge receipt
};

module.exports = {
    webhookRoute,
    webhookHandler,
};
