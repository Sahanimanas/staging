const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const temporary = require("../models/temporary.js");

// ✅ Stripe needs raw body to verify signature
const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  console.log("webhook called");
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // 👉 found in dashboard
    );
    console.log("📩 Event received:", event.type);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 🔹 Handle events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      console.log("✅ Checkout completed:", session.id);
      console.log("Customer Email:", session.customer_details?.email);

      // try {
      //   await temporary.findOneAndUpdate(
      //     { sessionId: session.id },
      //     {
      //       paymentIntentId: session.payment_intent,
      //       customerEmail: session.customer_details?.email, // ✅ save customer email
      //       amountTotal: session.amount_total,      // optional: save total amount
      //       currency: session.currency,
      //       status: session.status,
      //     },
      //     { upsert: true, new: true }
      //   );

      //   console.log("✅ Checkout session saved:", session.id);
      // } catch (dbErr) {
      //   console.error("❌ Failed to save session in DB:", dbErr.message);
      // }
      break;
    }

    case "payment_intent.succeeded": {
      const intent = event.data.object;
      console.log("💰 Payment succeeded:", intent.id);

      // try {
      //   await temporary.findOneAndUpdate(
      //     { paymentIntentId: intent.id },
      //     {
      //       status: intent.status,
      //       amount: intent.amount,
      //       currency: intent.currency,
      //     },
      //     { upsert: true, new: true }
      //   );
      //   console.log("✅ PaymentIntent saved:", intent.id);
      // } catch (dbErr) {
      //   console.error("❌ Failed to save PaymentIntent:", dbErr.message);
      // }
      break;
    }

    case "payment_intent.payment_failed": {
      const failedPayment = event.data.object;
      console.log("❌ Payment failed:", failedPayment.id);

      // try {
      //   await temporary.findOneAndUpdate(
      //     { paymentIntentId: failedPayment.id },
      //     { status: "failed" },
      //     { upsert: true, new: true }
      //   );
      // } catch (dbErr) {
      //   console.error("❌ Failed to save failed PaymentIntent:", dbErr.message);
      // }
      break;
    }

    default:
      console.log(`⚠️ Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = webhook;
