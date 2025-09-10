
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const sendSMS = require("../utils/twilio");
const BookingSchema = require("../models/BookingSchema.js");
const sendMail = require("../utils/sendmail.js"); 
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
        const bookingId = session.metadata?.bookingId;
         const booking = await BookingSchema.findById(bookingId).populate('therapistId').populate('clientId').populate('serviceId');
         if(booking){
           sendSMS(booking.clientId.phone, `Your booking is confirmed for ${booking.serviceId.name} on date ${booking.date.toDateString()} from ${new Date(booking.slotStart).toLocaleTimeString()} to ${new Date(booking.slotEnd).toLocaleTimeString()}. Therapist name: ${booking.therapistId.title}, Email: ${booking.clientId.email}, Phone: ${booking.clientId.phone}, paymentStatus: ${booking.paymentStatus}, Price: £${booking.price}, address: ${booking.clientId.address}`);
           sendSMS(booking.clientId.phone, `New booking for ${booking.date.toDateString()} from ${new Date(booking.slotStart).toLocaleTimeString()} to ${new Date(booking.slotEnd).toLocaleTimeString()}. Client: ${booking.clientId.name}, Email: ${booking.clientId.email}, Phone: ${booking.clientId.phone}, paymentStatus: ${booking.paymentStatus}, Price: £${booking.price}, address: ${booking.clientId.address}`);
         }
        if (!bookingId) {
          console.warn("⚠️ No bookingId found in metadata");
          break;
        }

        console.log(`✅ Checkout completed for booking: ${bookingId}`);

        // Mark booking as paid
      const updated=   await BookingSchema.findByIdAndUpdate(
          bookingId,
          {
            status: "confirmed",
            paymentStatus: "paid",
            paymentIntentId: session.payment_intent,
            customerEmail: session.customer_details?.email,
            price: session.amount_total, 
          },
          { new: true }
        );
console.log("booking updated",updated)
        console.log(`✅ Booking ${bookingId} marked as paid`);
        // ✅ Prepare mail content
  const clientMail = `
    <h2>Booking Confirmation</h2>
    <p>Hi ${booking.clientId.name},</p>
    <p>Your booking is confirmed!</p>
    <ul>
      <li><b>Service:</b> ${booking.serviceId.name}</li>
      <li><b>Date:</b> ${booking.date.toDateString()}</li>
      <li><b>Time:</b> ${new Date(booking.slotStart).toLocaleTimeString()} - ${new Date(booking.slotEnd).toLocaleTimeString()}</li>
      <li><b>Therapist:</b> ${booking.therapistId.title}</li>
      <li><b>Price:</b> £${booking.price}</li>
      <li><b>Status:</b> Paid ✅</li>
    </ul>
    <p>Thank you for booking with Noira.</p>
  `;

  const therapistMail = `
    <h2>New Booking Alert</h2>
    <p>Hello ${booking.therapistId.title},</p>
    <p>You have a new booking.</p>
    <ul>
      <li><b>Client:</b> ${booking.clientId.name} (${booking.clientId.email}, ${booking.clientId.phone})</li>
      <li><b>Service:</b> ${booking.serviceId.name}</li>
      <li><b>Date:</b> ${booking.date.toDateString()}</li>
      <li><b>Time:</b> ${new Date(booking.slotStart).toLocaleTimeString()} - ${new Date(booking.slotEnd).toLocaleTimeString()}</li>
      <li><b>Price:</b> £${booking.price}</li>
      <li><b>Status:</b> Paid ✅</li>
    </ul>
  `;

  // ✅ Send emails
  await sendMail(booking.clientId.email, "Booking Confirmation - Noira", clientMail);
  await sendMail(booking.therapistId.email, "New Booking Alert - Noira", therapistMail);

        break;
      }

      case "payment_intent.succeeded": {
        const intent = event.data.object;
        console.log("💰 Payment succeeded:", intent.id);

        // This can be optional if you handle everything in checkout.session.completed
        break;
      }

      case "payment_intent.payment_failed": {
        const failedPayment = event.data.object;
        const bookingId = failedPayment.metadata?.bookingId;

        if (bookingId) {
          await BookingSchema.findByIdAndUpdate(
            bookingId,
            { paymentStatus: "failed" },
            { new: true }
          );
          console.log(`❌ Booking ${bookingId} marked as failed`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          await BookingSchema.findByIdAndUpdate(
            bookingId,
            { paymentStatus: "failed" },
            { new: true }
          );
          console.log(`⚠️ Booking ${bookingId} marked as failed`);
        }
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type ${event.type}`);
    }

  res.json({ received: true });
};

module.exports = webhook;
