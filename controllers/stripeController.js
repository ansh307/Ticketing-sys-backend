const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = "usd", productName, concertId, userId, email, seatLabels, eventKey } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: productName || "Sample Product",
            },
            unit_amount: Math.round(amount * 100), // convert dollars to cents
          },
          quantity: seatLabels?.length || 1,
        },
      ], metadata: {
        concertId,
        userId,
        productName,
        email,
        seatLabels: JSON.stringify(seatLabels),
        eventKey
      },
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/tickets/purchase-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
};
