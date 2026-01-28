// routes/webhook.js
const express = require("express");
const Stripe = require("stripe");
const { paymentSuccessfulWebhook } = require("../utils/paymentSuccessfulWebhook");
const { confirmBookingAfterPayment } = require("../services/bookingService");

const webhookRoute = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

webhookRoute.post(
    "/",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const sig = req.headers["stripe-signature"];
        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

        } catch (err) {
            console.error(" Webhook signature verification failed:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        switch (event.type) {
            case "checkout.session.completed": {
                const paymentIntent = event.data.object;
                console.log("28", paymentIntent);
                const paymentId = paymentIntent.id;

                const { userId, productName,
                    concertId, eventKey, seatLabels } = paymentIntent.metadata;
                    const paymentMethod = paymentIntent.payment_method_types[0];


                console.log("31 line number -->", paymentIntent.metadata, paymentIntent.amount_total, paymentId);

                const body = {
                    userId, totalAmount: paymentIntent.amount_total,paymentMethod, productName, concertId, eventKey, seatLabels, paymentId,paymentIntent
                }

                if (userId && seatLabels) {
                    await confirmBookingAfterPayment(body);
                }
                else {
                    "bookine id and userid and als setId is missing"
                }
                console.log(`💰 Payment succeeded: ₹${paymentIntent.amount / 100}`);
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;
                const failureMessage = paymentIntent.last_payment_error?.message;
                console.log(` Payment failed: ${failureMessage}`);
                break;
            }

            case "charge.refunded": {
                const charge = event.data.object;
                console.log(`↩️ Payment refunded: ₹${charge.amount / 100}`);
                break;
            }

            default:
                console.log(`⚠️ Unhandled event type: ${event.type}`);
        }

        res.sendStatus(200);
    }
);

module.exports = webhookRoute;
