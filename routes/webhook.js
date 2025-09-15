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
    case "checkout.session.completed": {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) {
        console.warn("⚠️ No bookingId found in metadata");
        break;
      }

      const booking = await BookingSchema.findById(bookingId)
        .populate("therapistId")
        .populate("clientId")
        .populate("serviceId");

      const therapist = await TherapistProfile.findById(
        booking.therapistId
      ).populate("userId");

const paymentIntent = await stripe.paymentIntents.retrieve(
    session.payment_intent,
    { expand: ["latest_charge"] }
  );

  const receiptUrl = paymentIntent.latest_charge?.receipt_url;

      // if (booking) {
      //   sendSMS(
      //     booking.clientId.phone,
      //     `Your booking is confirmed for ${
      //       booking.serviceId.name
      //     } on ${booking.date.toDateString()} from ${new Date(
      //       booking.slotStart
      //     ).toLocaleTimeString()} to ${new Date(
      //       booking.slotEnd
      //     ).toLocaleTimeString()}. Therapist name: ${therapist.title}, Email: ${
      //       therapist.userId.email
      //     }, Phone: ${therapist.userId.phone}, paymentStatus: ${
      //       booking.paymentStatus
      //     }, Price: £${booking.price}, address: ${booking.clientId.address}`
      //   );
      //   sendSMS(
      //     therapist.userId.phone,
      //     `New booking for ${booking.date.toDateString()} \n from ${new Date(
      //       booking.slotStart
      //     ).toLocaleTimeString()} - ${new Date(
      //       booking.slotEnd
      //     ).toLocaleTimeString()} from ${booking.clientId.name.first} ${
      //       booking.clientId.name.last
      //     },\n Email: ${booking.clientId.email},\n Phone: ${
      //       booking.clientId.phone
      //     },\n paymentStatus: ${booking.paymentStatus},\n Price: £${
      //       booking.price.amount
      //     }, address: \n${booking.clientId.address.Building_No}\n ${
      //       booking.clientId.address.Street
      //     }\n ${booking.clientId.address.Locality}\n ${
      //       booking.clientId.address.PostalCode
      //     } `
      //   );
      // }
     

      // Mark booking as paid
      const updated = await BookingSchema.findByIdAndUpdate(
        bookingId,
        {
          status: "confirmed",
          paymentStatus: "paid",
          paymentIntentId: session.payment_intent,
          customerEmail: session.customer_details?.email,
          paymentStatus: session.payment_status,
          receipt_url: receiptUrl,
        },
        { new: true }
      );
      await Payment.findOneAndUpdate(
        { bookingId },
        {
          paymentStatus: "paid",
          providerPaymentId: session.payment_intent,
          stripeCheckoutSessionId: session.id,
          stripeClient_reference_id: session.client_reference_id,
        },
        { new: true }
      );
     const clientMail = `
    <h2>Booking Confirmed</h2>
    <p>Dear ${booking.clientId?.name?.first},</p>
    <p>Your appointment at Noira Massage Therapy is confirmed. Please find the details below:</p>

    <p><strong>Date:</strong> ${booking.date.toDateString()}</p>
    <p><strong>Time:</strong> ${new Date(booking.slotStart).toLocaleTimeString()} - ${new Date(booking.slotEnd).toLocaleTimeString()}</p>
    <p><strong>Service:</strong> ${booking.serviceId.name}</p>
    <p><strong>Price:</strong> £${booking.price.amount}</p>
    <p><strong>Payment Mode:</strong> Card</p> <p><strong>Location:</strong></p>
    <p>${booking.clientId.address.Building_No}, ${booking.clientId.address.Street}, ${booking.clientId.address.Locality}, ${booking.clientId.address.PostalCode}</p>
    <p><strong>Receipt:</strong> £${booking.receipt_url}</p>
    <p>For any assistance, please call us at +44 7350 700055.</p>
    <p>We look forward to serving you.</p>

    <p>Best regards,<br>Team NOIRA</p>
`;
      const therapistMail = `
    <h2>New Booking Alert</h2>
    <p>Dear ${booking.therapistId.title},</p>
    <p>You have a new booking.</p>
    <ul>
      <li><b>Client:</b> ${booking.clientId.name} (${booking.clientId.email}, ${
        booking.clientId.phone
      })</li>
      <li><b>Service:</b> ${booking.serviceId.name}</li>
      <li><b>Date:</b> ${booking.date.toDateString()}</li>
      <li><b>Time:</b> ${new Date(
        booking.slotStart
      ).toLocaleTimeString()} - ${new Date(
        booking.slotEnd
      ).toLocaleTimeString()}</li>
      <li><b>Price:</b> £${booking.price.amount}</li>
      <li><b>Status:</b> Paid ✅</li>
    </ul>
  `;

      // ✅ Send emails
      await sendMail(
        booking.clientId.email,
        "Booking Confirmation - Noira",
        clientMail,
        "booking"
      );
      await sendMail(
        therapist.userId.email,
        "New Booking Alert - Noira",
        therapistMail,
        "booking"
      );

      break;
    }

  //   case "charge.updated": {
  //     const charge = event.data.object;
  //     const previous_attributes = event.data.previous_attributes;
  //     // Find booking by paymentIntent (safe way)
  //     if (!charge.payment_intent) {
  //       console.warn("⚠️ No payment_intent on charge.updated");
  //       break;
  //     }

  //     const booking = await BookingSchema.findOneAndUpdate(
  //       { paymentIntentId: charge.payment_intent },
  //       { $set: { receipt_url: previous_attributes.receipt_url } },
  //       { new: true }
  //     );

  //     await Payment.findOneAndUpdate(
  //       { providerPaymentId },
  //       {
  //         payment_method_type: charge.payment_method_details.type,
  //       },
  //       { new: true }
  //     );

  //     if (booking) {
  //       console.log(
  //         `📎 Receipt URL saved for booking ${booking._id}: ${previous_attributes.receipt_url}`
  //       );

  //       // Send email with receipt link
  //       const clientMail = `
  //         <h2>Booking Receipt</h2>
  //         <p>Hi ${booking.clientId?.name?.first || "Client"},</p>
  //         <p>Your payment was successfully processed.</p>
  //         ${
  //           charge.receipt_url
  //             ? `<p><a href="${previous_attributes.receipt_url}" target="_blank" style="background:#0d6efd;color:#fff;padding:10px 15px;border-radius:8px;text-decoration:none;">Download Your Receipt</a></p>`
  //             : "<p>Receipt not available yet.</p>"
  //         }
  //         <p>Thank you for booking with Noira.</p>
  //       `;

  //       const therapistMail = `
  //   <h2>New Booking Alert</h2>
  //   <p>Hello ${booking.therapistId.title},</p>
  //   <p>You have a new booking.</p>
  //   <ul>
  //     <li><b>Client:</b> ${booking.clientId.name} (${booking.clientId.email}, ${
  //         booking.clientId.phone
  //       })</li>
  //     <li><b>Service:</b> ${booking.serviceId.name}</li>
  //     <li><b>Date:</b> ${booking.date.toDateString()}</li>
  //     <li><b>Time:</b> ${new Date(
  //       booking.slotStart
  //     ).toLocaleTimeString()} - ${new Date(
  //         booking.slotEnd
  //       ).toLocaleTimeString()}</li>
  //     <li><b>Price:</b> £${booking.price.amount}</li>
  //     <li><b>Status:</b> Paid ✅</li>
  //   </ul>
  // `;

  //       // ✅ Send emails
  //       await sendMail(
  //         booking.clientId.email,
  //         "Booking Confirmation - Noira",
  //         clientMail,
  //         "booking"
  //       );
  //       await sendMail(
  //         therapist.userId.email,
  //         "New Booking Alert - Noira",
  //         therapistMail,
  //         "booking"
  //       );

  //       break;
  //     }
  //   }
    //   case "payment_intent.succeeded": {
    //     const intent = event.data.object;

    //     // This can be optional if you handle everything in checkout.session.completed
    //     break;
    //   }

    //   case "payment_intent.payment_failed": {
    //     const failedPayment = event.data.object;
    //     if (failedPayment.metadata?.bookingId) {
    //       await BookingSchema.findByIdAndUpdate(
    //         failedPayment.metadata.bookingId,
    //         { paymentStatus: "failed" },
    //         { new: true }
    //       );
    //       console.log(
    //         `❌ Booking ${failedPayment.metadata.bookingId} marked as failed`
    //       );
    //     }
    //     break;
    //   }

    //   case "checkout.session.expired": {
    //     const session = event.data.object;
    //     if (session.metadata?.bookingId) {
    //       await BookingSchema.findByIdAndUpdate(
    //         session.metadata.bookingId,
    //         { paymentStatus: "failed" },
    //         { new: true }
    //       );
    //       await Payment.findOneAndUpdate(
    //         { bookingId: failedPayment.metadata.bookingId },
    //         { paymentStatus: "failed" },
    //         { new: true }
    //       );

    //       console.log(
    //         `⚠️ Booking ${session.metadata.bookingId} marked as failed`
    //       );
    //     }
    //     break;
    //   }

    default:
      console.log(`⚠️ Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = webhook;
