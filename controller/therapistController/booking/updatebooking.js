const Booking = require("../../../models/BookingSchema");
const sendMail = require("../../../utils/sendmail");
const generateReviewEmail = require("../../../utils/generateReviewEmail");
const BookingSchema = require("../../../models/BookingSchema");
const User = require("../../../models/userSchema")
const MarkComplete = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    const booking = await Booking.findById(bookingId).populate(
      "clientId",
      "email name"
    );
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    booking.status = "completed";
    if(booking.paymentStatus!=="paid"){
      booking.paymentStatus = "paid"
    }

    await booking.save();

    if (booking.status === "completed" && booking.clientId?.email) {
      const html = generateReviewEmail(
        booking.clientId.name.first,
        booking._id
      );

      await sendMail(
        booking.clientId.email,
        "We value your feedback – Review your recent session",
        html,
        "booking"
      );
    }

    res.status(200).json({
      message: `Booking status updated to `,
      booking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const declineBooking = async (req, res) => {
  const { bookingId } = req.params;
  try {
    // Validate bookingId length
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid bookingId" });
    }

    // Find the booking by ID and update its status to 'declined'
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: "declined" },
      { new: true } // return the updated document
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
      
    }
    const updatebooking = await BookingSchema.findById(bookingId).populate('therapistId').populate('clientId');

    const adminhtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 10px; border: 1px solid #ddd;">
  <h2 style="color: #333;">Booking Declined by Therapist</h2>
  <p style="color: #555; font-size: 16px;">
    Hello Admin,
  </p>
  <p style="color: #555; font-size: 16px;">
    This is an automated notification to inform you that a booking has been **declined** by the therapist.
  </p>
  <p style="color: #555; font-size: 16px;">
    Please find the booking details below:
  </p>
  <ul style="color: #555; font-size: 16px; list-style-type: none; padding: 0;">
    <li><strong>Booking ID:</strong> <span style="color: #888;">${bookingId}</span></li>
    <li><strong>Therapist:</strong> <span style="color: #888;">${updatebooking.therapistId.title}</span></li>
    <li><strong>Client:</strong> <span style="color: #888;">${updatebooking.clientId.name.first} ${updatebooking.clientId.name.last}</span></li>
    <li><strong>Session Date:</strong> <span style="color: #888;">${booking.date}</span></li>
    <li><strong>Session Time:</strong> <span style="color: #888;">${booking.slotStart}</span></li>
    
    <li><strong>Price:</strong> <span style="color: #888;">${booking.price.amount}</span></li>
  </ul>
  <p style="color: #888; font-size: 14px; margin-top: 20px;">
    Please take appropriate action to notify the client and manage this booking.
  </p>
  
  <p style="color: #888; font-size: 14px; margin-top: 20px;">
    Thank you, <br/> Noira Team
  </p>
</div>`



    const admins = await User.find({ role: 'admin' });
    console.log("admins",admins)
  
  for (const admin of admins) {
    await sendMail(
      admin.email,
       `Booking Declined by Therapist`,
      adminhtml,
      "booking"
    );
  }

  
    res.json({ message: "Booking declined", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
module.exports = { MarkComplete, declineBooking };
