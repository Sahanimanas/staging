const BookingSchema = require("../../models/BookingSchema");
const Service = require("../../models/ServiceSchema");
const User = require("../../models/userSchema");
const AvailabilitySchema = require("../../models/AvailabilitySchema");
const Stripe = require("stripe");
const Payment = require("../../models/PaymentSchema");
const TherapistProfile = require("../../models/TherapistProfiles");
const sendMail = require("../../utils/sendmail");
const sendCustomSMS = require("../../utils/smsService");
/**
 * Helper to split availability blocks after a booking
 */
function blockBookedSlot(blocks, slotStart, slotEnd) {
  const newBlocks = [];

  blocks.forEach((block) => {
    if (!block.isAvailable) {
      newBlocks.push(block);
      return;
    }

    const [bh, bm] = block.startTime.split(":").map(Number);
    const [eh, em] = block.endTime.split(":").map(Number);

    const blockStart = bh * 60 + bm; // block start in minutes
    const blockEnd = eh * 60 + em;
    const bookingStart =
      slotStart.getUTCHours() * 60 + slotStart.getUTCMinutes();
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
        isAvailable: true,
      });
    }

    // --- Booked slot ---
    newBlocks.push({
      startTime: formatTime(Math.max(bookingStart, blockStart)),
      endTime: formatTime(Math.min(bookingEnd, blockEnd)),
      isAvailable: false,
    });

    // --- After booking ---
    if (bookingEnd < blockEnd) {
      newBlocks.push({
        startTime: formatTime(bookingEnd),
        endTime: formatTime(blockEnd),
        isAvailable: true,
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
      couponCode,
      email,
      therapistId,
      serviceId,
      optionIndex,
      ritualPurchaseid,
      date,
      time,
      notes,
    } = req.body;

    if (
      !email ||
      !therapistId ||
      !serviceId ||
      !date ||
      !time ||
      optionIndex === undefined
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const ritualPurchaseId = ritualPurchaseid || null;

    // Find client
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User no3t found" });

    // Parse date + time in UTC
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(
      Date.UTC(year, month - 1, day, hours, minutes, 0, 0)
    );

    if (isNaN(slotStart.getTime())) {
      return res.status(400).json({ error: "Invalid date or time format" });
    }

    // Fetch service and option
    const serviceDoc = await Service.findById(serviceId);
    if (!serviceDoc)
      return res.status(404).json({ error: "Service not found" });

    const option = serviceDoc.options[optionIndex];
    if (!option) return res.status(400).json({ error: "Invalid option index" });

    const slotEnd = new Date(
      slotStart.getTime() + option.durationMinutes * 60000
    );

    // Price calculation
    let finalPrice = option.price.amount;
    let surcharge = false;
    const hour = parseInt(
      new Date(slotStart).toLocaleString("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        hour12: false,
      }),
      10
    );

    if (hour >= 23 || hour < 9) {
      surcharge = true;
      finalPrice += 15;
    }
// 🔹 MODIFIED: Apply coupon code discount
    if (couponCode) {
      const formattedCode = couponCode.trim().toUpperCase();
      if (formattedCode === "RELAX10") {
        finalPrice = finalPrice * 0.9; // 10% discount
      } else if (formattedCode === "RELAX100") {
        finalPrice = 0; // 100% discount
      }
    }
    // 🔹 END MODIFICATION
    const newdate = new Date(slotStart); // copy original date
    newdate.setUTCHours(0, 0, 0, 0);

    // Create booking
    const booking = await BookingSchema.create({
      clientId: user._id,
      serviceId,
      therapistId,
      ritualPurchaseId,
      date: newdate,
      slotStart,
      slotEnd,
      status: "confirmed",
      paymentStatus: "pending",
      paymentMode: "cash",
      price: { amount: finalPrice, currency: "gbp" },
      eliteHourSurcharge: surcharge,
      notes,
    });

    // Block the booked slot from availability
    const availabilityDoc = await AvailabilitySchema.findOne({
      therapistId,
      date: newdate,
    });

    if (availabilityDoc) {
      availabilityDoc.blocks = blockBookedSlot(
        availabilityDoc.blocks,
        slotStart,
        slotEnd
      );
      await availabilityDoc.save();
    }

    const bookingnew = await BookingSchema.findById(booking._id)
      .populate("therapistId")
      .populate("clientId")
      .populate("serviceId");

    const therapist = await TherapistProfile.findById(
      bookingnew.therapistId
    ).populate("userId");

    const start = new Date(bookingnew.slotStart);
    const end = new Date(bookingnew.slotEnd);

    // Format in UTC so it does NOT shift to local
    const startUTC = `${String(start.getUTCHours()).padStart(2, "0")}:${String(
      start.getUTCMinutes()
    ).padStart(2, "0")}`;
    const endUTC = `${String(end.getUTCHours()).padStart(2, "0")}:${String(
      end.getUTCMinutes()
    ).padStart(2, "0")}`;
// console.log(bookingnew)


    const durationMinutes = Math.round((end - start) / (1000 * 60));
 
    const clientMail = `
    <h2>Booking Confirmed</h2>
    <p>Dear ${bookingnew.clientId?.name?.first} ${
      bookingnew.clientId?.name?.last
    },</p>
    <p>Your appointment at Noira Massage Therapy is confirmed. Please find the details below:</p>
    <p><strong>BookingId:</strong> ${bookingnew._id}</p>
    <p><strong>Date:</strong> ${bookingnew.date.toDateString()}</p>
    <p><strong>Time:</strong> ${startUTC}</p>
    <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
    <p><strong>Service:</strong> ${bookingnew.serviceId.name}</p>
    <p><strong>Price:</strong> £${bookingnew.price.amount}</p>
    <p><strong>Payment Mode:</strong> ${
      bookingnew.paymentMode
    }</p> <p><strong>Location:</strong></p>
    <p><strong>${bookingnew.clientId.address.Building_No}, ${
      bookingnew.clientId.address.Street
    }, ${bookingnew.clientId.address.Locality}, ${
      bookingnew.clientId.address.PostalCode
    }</strong></p>
    <p>For any assistance, please call us at +44 7350 700055.</p>
    <p>We look forward to serving you.</p>

    <p>Best regards,<br>Team NOIRA</p>
`;

    const therapistMail = `
    <h2>New Booking Alert</h2>
    <p>Dear ${bookingnew.therapistId.title},</p>
    <p>You have a new booking. Please find the details below:</p>
    <p><strong>BookingId:</strong> ${bookingnew._id}</p>
    <p><strong>Client:</strong> ${bookingnew.clientId.name.first} ${
      bookingnew.clientId.name.last}</p>
    <p><strong>Contact:</strong> ${bookingnew.clientId.phone}</p>
    <p><strong>Service:</strong> ${bookingnew.serviceId.name}</p>
    <p><strong>Date:</strong> ${bookingnew.date.toDateString()}</p>
    <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
    <p><strong>Time:</strong> ${startUTC} - ${endUTC}</p>
    <p><strong>Price:</strong> £${bookingnew.price.amount}</p>
    <p><strong>Payment Mode:</strong> ${
      bookingnew.paymentMode
    }</p>
    <p><strong>Location:</strong></p>
    <p><strong>${bookingnew.clientId.address.Building_No}, ${
      bookingnew.clientId.address.Street
    }, ${bookingnew.clientId.address.Locality}, ${
      bookingnew.clientId.address.PostalCode
    }</strong></p>
    <p>For any assistance, please call us at  +44 7350 700055.</p>
    <p>Best regards,<br>Team NOIRA</p>
`;

const adminMail = `
  <h2>New Booking Notification</h2>
  <p><strong>BookingId:</strong> ${bookingnew._id}</p>
  <h3>Client Details</h3>
  <p><strong>Name:</strong> ${bookingnew.clientId?.name?.first} ${bookingnew.clientId?.name?.last}</p>
  <p><strong>Contact:</strong> ${bookingnew.clientId?.phone}</p>
  <p><strong>Address:</strong> ${bookingnew.clientId.address.Building_No}, ${bookingnew.clientId.address.Street}, ${bookingnew.clientId.address.Locality}, ${bookingnew.clientId.address.PostalCode}</p>

  <h3>Therapist Details</h3>
  <p><strong>Name / Title:</strong> ${bookingnew.therapistId.title}</p>

  <h3>Booking Details</h3>
  <p><strong>Date:</strong> ${bookingnew.date.toDateString()}</p>
  <p><strong>Time:</strong> ${startUTC} - ${endUTC}</p>
  <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
  <p><strong>Service:</strong> ${bookingnew.serviceId.name}</p>
  <p><strong>Price:</strong> £${bookingnew.price.amount}</p>
  <p><strong>Payment Mode:</strong> ${bookingnew.paymentMode}</p>
  
  <p>Best regards,<br>Team NOIRA</p>
`;

    await sendMail(
      bookingnew.clientId.email,
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
    await sendMail(
      "info@noira.co.uk",  //check
      "New Booking Notification",
      adminMail,
      "booking"
    )
 


    const message = `Your NOIRA massage is confirmed for ${bookingnew.date.toLocaleDateString(
      "en-GB")}, ${startUTC} ${durationMinutes}mins. Therapist - ${
      bookingnew.therapistId.title}.Please prepare a quiet space (bed/floor) and ensure comfort.
    Team Noira`;

    const therapistmessage = `${bookingnew.date.toLocaleDateString("en-GB")} ${startUTC} ${durationMinutes}mins £${bookingnew.price.amount
    } ${bookingnew.paymentMode.toUpperCase()} ${bookingnew.clientId?.name?.first?.toUpperCase()} ${bookingnew.clientId.phone} at ${bookingnew.clientId.address.Building_No} ${bookingnew.clientId.address.Street} ${bookingnew.clientId.address.Locality} ${bookingnew.clientId.address.PostalCode } ${bookingnew.serviceId.name} 
Team Noira`;

    await sendCustomSMS(bookingnew.clientId.phone, message);
    await sendCustomSMS(therapist.userId.phone, therapistmessage);

   
    // console.log(updated);
    return res.status(200).json({ message: "Booking confirmed" });
  } catch (error) {
    console.error("Booking creation failed:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = createBooking;
