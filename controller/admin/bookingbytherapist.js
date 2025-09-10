const mongoose = require("mongoose");
const Booking = require("../../models/BookingSchema");

const getBookingsByTherapist = async (req, res) => {
  try {
    const { therapistId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(therapistId)) {
      return res.status(400).json({ error: "Invalid therapist ID" });
    }

    const bookings = await Booking.find({ therapistId })
      .populate("clientId")
      .populate("serviceId")
      .populate("therapistId");

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ error: "No bookings found for this therapist" });
    }

    return res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = getBookingsByTherapist;
