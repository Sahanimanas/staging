
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const temporary = require('../models/temporary.js')

// ✅ Stripe needs raw body to verify signature
const webhook= async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // 👉 found in dashboard
    );
    console.log(event.type)
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 🔹 Handle events
  switch (event.type) {
    case "payment_intent.succeeded":
      const session = event.data.object;
      console.log("✅ Payment successful:", session.id);
      // TODO: update booking in DB, send email, etc.
      console.log(session);
     try {
          // Save in DB
          await temporary.findOneAndUpdate(
            { sessionId: session.id },
            {
             
              paymentIntentId: session.payment_intent,
              status: session.status
            },
            { upsert: true, new: true }
          );

          console.log("✅ Checkout session saved:", session.id);
        } catch (dbErr) {
          console.error("❌ Failed to save session in DB:", dbErr.message);
        }
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log("❌ Payment failed:", failedPayment.id);
      // TODO: mark as failed in DB
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = webhook;
