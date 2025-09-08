const Booking = require("../../../models/BookingSchema");

const bookingUser = async (req, res) => {
  const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
  try {
    // Validate userId length
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Find all bookings for this user
    const bookings = await Booking.find({ clientId: userId })
      .populate("therapistId") // populate therapist's title
      .populate("serviceId") // populate service info
      .sort({ date: -1 })
      .lean();
  const totalBookings = bookings.length;
    const totalPages = Math.ceil(totalBookings / limit);
    const paginatedBookings = bookings.slice(skip, skip + limit);

    res.json({  totalPages ,bookings: paginatedBookings,});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = bookingUser;