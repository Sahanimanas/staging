const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const sendSMS = require("../utils/twilio");
const BookingSchema = require("../models/BookingSchema.js");
const sendMail = require("../utils/sendmail.js");
const TherapistProfile = require("../models/TherapistProfiles.js");
const Payment = require("../models/PaymentSchema.js");
const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
 
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
     
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
  case "checkout.session.completed":
  case "charge.updated": {
    // ✅ Shared logic: find booking
    let session, charge, bookingId;
console.log(event.type)
    if (event.type === "checkout.session.completed") {
      session = event.data.object;
      bookingId = session.metadata?.bookingId;
      if (!bookingId) {
        console.warn("⚠️ No bookingId found in metadata");
        break;
      }
    } else if (event.type === "charge.updated") {
      charge = event.data.object;
      if (!charge.payment_intent) {
        console.warn("⚠️ No payment_intent on charge.updated");
        break;
      }
    }

    let booking;
    if (bookingId) {
      booking = await BookingSchema.findById(bookingId)
        .populate("therapistId")
        .populate("clientId")
        .populate("serviceId");
    } else if (charge) {
      booking = await BookingSchema.findOne({ paymentIntentId: charge.payment_intent })
        .populate("therapistId")
        .populate("clientId")
        .populate("serviceId");
    }

    if (!booking) {
      console.warn("⚠️ No booking found for event");
      break;
    }
console.log(session)
    // ✅ If checkout.session.completed: update booking + payment status
    if (session) {
      await BookingSchema.findByIdAndUpdate(
        booking._id,
        {
          status: "confirmed",
          paymentStatus: "paid",
          paymentIntentId: session.payment_intent,
          customerEmail: session.customer_details?.email,
          paymentStatus: session.payment_status,
        },
        { new: true }
      );

      await Payment.findOneAndUpdate(
        { bookingId: booking._id },
        {
          paymentStatus: "paid",
          providerPaymentId: session.payment_intent,
        },
        { new: true }
      );

      // sendSMS(
      //   booking.clientId.phone,
      //   `Your booking is confirmed for ${booking.serviceId.name} on ${booking.date.toDateString()} from ${new Date(
      //     booking.slotStart
      //   ).toLocaleTimeString()} to ${new Date(
      //     booking.slotEnd
      //   ).toLocaleTimeString()}. Therapist: ${booking.therapistId.title}, Email: ${
      //     booking.therapistId.userId.email
      //   }, Phone: ${booking.therapistId.userId.phone}, Payment: ${
      //     booking.paymentStatus
      //   }, Price: £${booking.price.amount}, Address: ${booking.clientId.address}`
      // );

      // sendSMS(
      //   booking.therapistId.userId.phone,
      //   `New booking for ${booking.date.toDateString()} from ${new Date(
      //     booking.slotStart
      //   ).toLocaleTimeString()} - ${new Date(
      //     booking.slotEnd
      //   ).toLocaleTimeString()} by ${booking.clientId.name.first} ${
      //     booking.clientId.name.last
      //   }, Email: ${booking.clientId.email}, Phone: ${booking.clientId.phone}, Price: £${
      //     booking.price.amount
      //   }, Address: ${booking.clientId.address.Building_No}, ${booking.clientId.address.Street}, ${booking.clientId.address.Locality}, ${booking.clientId.address.PostalCode}`
      // );

        // ${
        //   charge.receipt_url
        //     ? `<p><a href="${charge.receipt_url}" target="_blank" style="background:#0d6efd;color:#fff;padding:10px 15px;border-radius:8px;text-decoration:none;">Download Your Receipt</a></p>`
        //     : "<p>Receipt not available yet.</p>"
        // }
      
//         const start = new Date(booking.slotStart);
// const end = new Date(booking.slotEnd);

// // Difference in milliseconds
// const diffMs = end - start;

// // Convert to hours and minutes
// const diffMins = Math.floor(diffMs / 60000); // total minutes
// const hours = Math.floor(diffMins / 60);
// const minutes = diffMins % 60;

// const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;


//  `
//        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
//   <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 20px;">
//     <p style="font-size: 16px; color: #333;">Dear <b>${booking.clientId.name.first} ${booking.clientId.name.last}</b>,</p>
//     <p style="font-size: 16px; color: #333;">
//       Your appointment at <b>Noira Massage Therapy</b> is confirmed. Please find the details below:
//     </p>
//     <p style="font-size: 15px; color: #333; line-height: 1.6;">
//       <b>Date:</b>${booking.date.toDateString()}<br>
//       <b>Time:</b>  ${new Date(booking.slotStart).toLocaleTimeString()} - ${new Date(
//         booking.slotEnd
//       ).toLocaleTimeString()}<br>
//       <b>Duration:</b> ${duration} <br>
//       <b>Focus:</b>${booking.serviceId.name} <br>
//       <b>Price:</b> ${booking.price.amount} <br>
      
//     </p>
//     <p style="font-size: 15px; color: #333; line-height: 1.6;">
//       <b>Location:</b><br>
//      ${booking.clientId.address}
//     </p>
//     <p style="font-size: 15px; color: #333;">
//       For any assistance, please call us at <b>+44 7350 700055</b>.
//     </p>
//     <p style="font-size: 15px; color: #333;">
//       We look forward to serving you.
//     </p>
//     <p style="font-size: 15px; color: #333;">
//       Best regards,<br>
//       <b>Team NOIRA</b>
//     </p>
//   </div>
// </div>

//       `

      const clientMail ="<div>booking done</div>"


      // `
      //   <h2>New Booking Alert</h2>
      //   <p>Hello ${booking.therapistId.title},</p>
      //   <p>You have a new booking.</p>
      //   <ul>
      //     <li><b>Client:</b> ${booking.clientId.name.first} ${booking.clientId.name.last} (${booking.clientId.email}, ${booking.clientId.phone})</li>
      //     <li><b>Service:</b> ${booking.serviceId.name}</li>
      //     <li><b>Date:</b> ${booking.date.toDateString()}</li>
      //     <li><b>Time:</b> ${new Date(booking.slotStart).toLocaleTimeString()} - ${new Date(
      //   booking.slotEnd
      // ).toLocaleTimeString()}</li>
      //     <li><b>Price:</b> £${booking.price.amount}</li>
      //     <li><b>Status:</b> Paid ✅</li>
      //   </ul>
      // `;
      const therapistMail = "<div>therpist done</div>"

      await sendMail(booking.clientId.email, "Booking Confirmation - Noira", clientMail, "booking");
      await sendMail(booking.therapistId.userId.email, "New Booking Alert - Noira", therapistMail, "booking");
      console.log()
    }

    // ✅ If charge.updated: update receipt + send emails
    if (charge) {
      await BookingSchema.findByIdAndUpdate(
        booking._id,
        { $set: { receiptUrl: charge.receipt_url } },
        { new: true }
      );

      await Payment.findOneAndUpdate(
        { providerPaymentId: charge.payment_intent },
        {
          method: charge.payment_method_details,
        },
        { new: true }
      );

      const clientMail = `
        <h2>Booking Receipt</h2>
        <p>Hi ${booking.clientId?.name?.first || "Client"},</p>
        <p>Your payment was successfully processed.</p>
        ${
          charge.receipt_url
            ? `<p><a href="${charge.receipt_url}" target="_blank" style="background:#0d6efd;color:#fff;padding:10px 15px;border-radius:8px;text-decoration:none;">Download Your Receipt</a></p>`
            : "<p>Receipt not available yet.</p>"
        }
        <p>Thank you for booking with Noira.</p>
      `;

      const therapistMail = `
        <h2>New Booking Alert</h2>
        <p>Hello ${booking.therapistId.title},</p>
        <p>You have a new booking.</p>
        <ul>
          <li><b>Client:</b> ${booking.clientId.name.first} ${booking.clientId.name.last} (${booking.clientId.email}, ${booking.clientId.phone})</li>
          <li><b>Service:</b> ${booking.serviceId.name}</li>
          <li><b>Date:</b> ${booking.date.toDateString()}</li>
          <li><b>Time:</b> ${new Date(booking.slotStart).toLocaleTimeString()} - ${new Date(
        booking.slotEnd
      ).toLocaleTimeString()}</li>
          <li><b>Price:</b> £${booking.price.amount}</li>
          <li><b>Status:</b> Paid ✅</li>
        </ul>
      `;

      await sendMail(booking.clientId.email, "Booking Confirmation - Noira", clientMail, "booking");
      await sendMail(booking.therapistId.userId.email, "New Booking Alert - Noira", therapistMail, "booking");
      console.log()
    }

    break;
  }

    case "payment_intent.succeeded": {
      const intent = event.data.object;


      // This can be optional if you handle everything in checkout.session.completed
      break;
    }

    case "payment_intent.payment_failed": {
      const failedPayment = event.data.object;
      if (failedPayment.metadata?.bookingId) {
        await BookingSchema.findByIdAndUpdate(
          failedPayment.metadata.bookingId,
          { paymentStatus: "failed" },
          { new: true }
        );
        console.log(
          `❌ Booking ${failedPayment.metadata.bookingId} marked as failed`
        );
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      if (session.metadata?.bookingId) {
        await BookingSchema.findByIdAndUpdate(
          session.metadata.bookingId,
          { paymentStatus: "failed" },
          { new: true }
        );
        await Payment.findOneAndUpdate(
          { bookingId: failedPayment.metadata.bookingId },
          { paymentStatus: "failed" },
          { new: true }
        );

        console.log(
          `⚠️ Booking ${session.metadata.bookingId} marked as failed`
        );
      }
      break;
    }

    default:
      console.log(`⚠️ Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = webhook;
