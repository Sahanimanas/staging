const Booking = require("../../models/BookingSchema");
const Service = require("../../models/ServiceSchema");
const User = require("../../models/userSchema");
const AvailabilitySchema = require("../../models/AvailabilitySchema");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const checkoutsession = require('../../models/temporary');

/**
 * Helper to split availability blocks after a booking
 */
function blockBookedSlot(blocks, slotStart, slotEnd) {
  const newBlocks = [];

  blocks.forEach(block => {
    if (!block.isAvailable) {
      newBlocks.push(block);
      return;
    }

    const [bh, bm] = block.startTime.split(":").map(Number);
    const [eh, em] = block.endTime.split(":").map(Number);
  
    const blockStart = bh * 60 + bm; // block start in minutes
    const blockEnd = eh * 60 + em;
    const bookingStart = slotStart.getUTCHours() * 60 + slotStart.getUTCMinutes();
    const bookingEnd = slotEnd.getUTCHours() * 60 + slotEnd.getUTCMinutes();

    // If booking is completely outside this block
    if (bookingEnd <= blockStart || bookingStart >= blockEnd) {
      newBlocks.push(block);
      return;
    }

    // --- Before booking ---
    if (bookingStart > blockStart) {
      newBlocks.push({
        startTime: formatTime(blockStart),
        endTime: formatTime(bookingStart),
        isAvailable: true
      });
    }

    // --- Booked slot ---
    newBlocks.push({
      startTime: formatTime(Math.max(bookingStart, blockStart)),
      endTime: formatTime(Math.min(bookingEnd, blockEnd)),
      isAvailable: false
    });

    // --- After booking ---
    if (bookingEnd < blockEnd) {
      newBlocks.push({
        startTime: formatTime(bookingEnd),
        endTime: formatTime(blockEnd),
        isAvailable: true
      });
    }
  });
// console.log(newBlocks)
  return newBlocks;
}

// helper: convert minutes → HH:mm
function formatTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

const createBooking = async (req, res) => {
  try {
    const {
      email,
      therapistId,
      serviceId,
      optionIndex,
      ritualPurchaseid,
      date,
      time,
      notes,
    } = req.body;

    if (!email || !therapistId || !serviceId || !date || !time || optionIndex === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
console.log(req.body)
    const ritualPurchaseId = ritualPurchaseid || null;

    // Find client
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Parse date + time in UTC
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

    if (isNaN(slotStart.getTime())) {
      return res.status(400).json({ error: "Invalid date or time format" });
    }

    // Fetch service and option
    const serviceDoc = await Service.findById(serviceId);
    if (!serviceDoc) return res.status(404).json({ error: "Service not found" });

    const option = serviceDoc.options[optionIndex];
    if (!option) return res.status(400).json({ error: "Invalid option index" });

    const slotEnd = new Date(slotStart.getTime() + option.durationMinutes * 60000);

    // Price calculation
    let finalPrice = option.price.amount;
    let surcharge = false;
    const hour = slotStart.getUTCHours();
    if (hour >= 23 || hour < 9) {
      surcharge = true;
      finalPrice += 15;
    }
 
const newdate = new Date(slotStart); // copy original date
newdate.setUTCHours(0, 0, 0, 0);

   
    // Create booking
    const booking = await Booking.create({
      clientId: user._id,
      serviceId,
      therapistId,
      ritualPurchaseId,
      date: newdate,
      slotStart,
      slotEnd,
      status: "confirmed",
      paymentStatus: "paid",
      price: { amount: finalPrice, currency: "gbp" },
      eliteHourSurcharge: surcharge,
      notes,
    });

    // Block the booked slot from availability
    const availabilityDoc = await AvailabilitySchema.findOne({
      therapistId,
      date: newdate
    });

    if (availabilityDoc) {
      availabilityDoc.blocks = blockBookedSlot(availabilityDoc.blocks, slotStart, slotEnd);
      await availabilityDoc.save();
    }
    // console.log("Updated availability blocks", availabilityDoc.blocks);
    // Stripe checkout session
    const amount = Math.round(finalPrice * 100);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: serviceDoc.name,
              description: `Booking ID: ${booking._id}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:5173/paymentsuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/paymentfailed`,
      customer_email: user.email,
      metadata: { bookingId: "book_011" },
    });

    // await checkoutsession.create({
    //   sessionId: session.id,
    //   customerEmail: user.email,
    //   amountTotal: session.amount_total,
    //   currency: session.currency,
    //   status: session.status,
    //   rawData: session,
    // });

    return res.json({ url: session.url });

  } catch (error) {
    console.error("Booking creation failed:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = createBooking;
