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

      const start = new Date(updated.slotStart);
const end = new Date(updated.slotEnd);

// Format in UTC so it does NOT shift to local
const startUTC = `${String(start.getUTCHours()).padStart(2, "0")}:${String(
  start.getUTCMinutes()
).padStart(2, "0")}`;
const endUTC = `${String(end.getUTCHours()).padStart(2, "0")}:${String(
  end.getUTCMinutes()
).padStart(2, "0")}`;

const durationMinutes = Math.round((end - start) / (1000 * 60));

     const clientMail = `
    <h2>Booking Confirmed</h2>
    <p>Dear ${booking.clientId?.name?.first},</p>
    <p>Your appointment at Noira Massage Therapy is confirmed. Please find the details below:</p>

    <p><strong>Date:</strong> ${booking.date.toDateString()}</p>
    <p><strong>Time:</strong> ${startUTC}</p>
    <p><strong>Duration:</strong> ${durationMinutes}</p>
    <p><strong>Service:</strong> ${booking.serviceId.name}</p>
    <p><strong>Price:</strong> £${booking.price.amount}</p>
    <p><strong>Payment Mode:</strong> ${booking.paymentMode}</p> <p><strong>Location:</strong></p>
    <p><strong>${booking.clientId.address.Building_No}, ${booking.clientId.address.Street}, ${booking.clientId.address.Locality}, ${booking.clientId.address.PostalCode}</strong></p>
    <p><strong>Receipt:</strong> ${updated.receipt_url}</p>
    <p>For any assistance, please call us at +44 7350 700055.</p>
    <p>We look forward to serving you.</p>

    <p>Best regards,<br>Team NOIRA</p>
`;
      const therapistMail = `
    <h2>New Booking Alert</h2>
    <p>Dear ${booking.therapistId.title},</p>
    <p>You have a new booking. Please find the details below:</p>

    <p><strong>Client:</strong> ${booking.clientId.name.first} ${booking.clientId.name.last}</p>
    <p><strong>Contact:</strong> ${booking.clientId.phone}</p>
    <p><strong>Service:</strong> ${booking.serviceId.name}</p>
    <p><strong>Date:</strong> ${booking.date.toDateString()}</p>
    <p><strong>Duration:</strong> ${durationMinutes}</p>
    <p><strong>Time:</strong> ${new Date(booking.slotStart).toLocaleTimeString()} - ${new Date(booking.slotEnd).toLocaleTimeString()}</p>
    <p><strong>Price:</strong> £${booking.price.amount}</p>
    <p><strong>Status:</strong> Paid ✅</p>
    
    <p>For any assistance, please call the client at ${booking.clientId.phone}.</p>
    
    <p>Best regards,<br>Team NOIRA</p>
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
     
      const clientmessage = `Your NOIRA massage is confirmed for  ${booking.date.toDateString()}, ${startUTC} ${durationMinutes}mins. Therapist:${booking.therapistId.title}. Please prepare a quiet space (bed/floor) and ensure comfort.`


     const therapistmessage = `${booking.date.toLocaleDateString(
      "en-GB"
    )} ${startUTC} ${durationMinutes}mins £${
      booking.price.amount
    } ${booking.paymentMode.toUpperCase()}
${booking.clientId?.name?.first?.toUpperCase()} ${therapist.userId.phone}
at ${booking.clientId.address.Building_No}, ${
      booking.clientId.address.Street
    }, ${booking.clientId.address.Locality}, ${
      booking.clientId.address.PostalCode
    }
, ${booking.serviceId.name},\nTeam Noira`;
       await sendCustomSMS(booking.clientId.phone, clientmessage);
       
       await sendCustomSMS(therapist.userId.phone, therapistmessage);

      break;
    }


      case "checkout.session.expired": {
  const session = event.data.object;
  if (session.metadata?.bookingId) {
    const bookingId = session.metadata.bookingId;

    // Step 1: Find the booking to get its details before deletion
    const bookingToDelete = await BookingSchema.findById(bookingId);

    if (bookingToDelete) {
      // Step 2: Delete the booking record from the database
      await BookingSchema.findByIdAndDelete(bookingId);

      // Step 3: Find the availability document for the booking date
      const availabilityDoc = await TherapistAvailability.findOne({
        therapistId: bookingToDelete.therapistId,
        date: new Date(bookingToDelete.slotStart.setUTCHours(0, 0, 0, 0)),
      });

      if (availabilityDoc) {
        // Step 4: Find the specific slot and mark it as available
        const blockIndex = availabilityDoc.blocks.findIndex(block => 
          new Date(block.startTime).getTime() === bookingToDelete.slotStart.getTime() &&
          new Date(block.endTime).getTime() === bookingToDelete.slotEnd.getTime()
        );

        if (blockIndex !== -1) {
          availabilityDoc.blocks[blockIndex].isAvailable = true;
          await availabilityDoc.save();
          console.log(`✅ Slot for booking ${bookingId} has been freed.`);
        }
      }

      console.log(`🗑️ Booking ${bookingId} has been deleted due to expired session.`);
    }

    // Step 5: Update the payment record to 'failed'
    await Payment.findOneAndUpdate(
      { bookingId: bookingId },
      { paymentStatus: "failed" },
      { new: true }
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
