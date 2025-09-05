const Booking = require("../../../models/BookingSchema");

const bookingUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Validate userId length
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Find all bookings for this user
    const bookings = await Booking.find({ clientId: userId })
      .populate("therapistId", "title") // populate therapist's title
      .populate("serviceId", "name options") // populate service info
      .sort({ date: -1 }); // latest first

    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = bookingUser;