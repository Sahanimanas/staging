// backend/routes/webhook.js
const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const Booking = require("../models/Booking");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;

  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.sendStatus(400);
  }

  // ✅ Handle payment success
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.bookingId;

    await Booking.findByIdAndUpdate(bookingId, { paymentStatus: "paid" });
    console.log("✅ Booking marked as paid:", bookingId);
  }

  res.sendStatus(200);
});

module.exports = router;
