const Booking = require("../../../models/BookingSchema")

const MarkComplete = async (req, res) => {
  const { bookingId } = req.params;
  try {
    // Validate bookingId length
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid bookingId" });
    }

    // Find the booking by ID and update its status to 'completed'
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: "completed" },
      { new: true } // return the updated document
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ message: "Booking marked as completed", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

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

    res.json({ message: "Booking declined", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }                     
}
module.exports = { MarkComplete, declineBooking };