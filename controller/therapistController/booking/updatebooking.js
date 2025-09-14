const Booking = require("../../../models/BookingSchema");
const sendMail = require("../../../utils/sendmail");
const generateReviewEmail = require("../../../utils/generateReviewEmail");

const MarkComplete = async (req, res) => {
  try {
    
    const bookingId = req.params.bookingId;
  console.log("mark booking",bookingId);
    const booking = await Booking.findById(bookingId).populate("clientId", "email name");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
booking.status = "completed";

    await booking.save();

    if (booking.status === "completed" && booking.clientId?.email) {
      const html = generateReviewEmail(booking.clientId.name.first, booking._id);
      console.log(booking.clientId.email)
      await sendMail(
        booking.clientId.email,
        "We value your feedback – Review your recent session",
        html,"booking"
      );
    }

    res.status(200).json({
      message: `Booking status updated to `,
      booking,
    });

  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = MarkComplete;

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
    const html = `
<p><strong>Booking Update:</strong></p>
<p>Your booking has been <strong style="color:red;">declined</strong> by the therapist for the BookingId: ${bookingId}.</p>
<p>We're sorry for the inconvenience.</p>
`;
      await sendMail(
        booking.clientId.email,
        "Booking Declined by therapist, try with new slot",
        html,"booking"
      );
    res.json({ message: "Booking declined", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }                     
}
module.exports = { MarkComplete, declineBooking };