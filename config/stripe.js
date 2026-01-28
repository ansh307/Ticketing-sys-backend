const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment variables");
}

// Create a Stripe instance with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
