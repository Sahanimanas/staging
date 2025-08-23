const Booking = require('../../models/BookingSchema');

// Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("clientId", "name email")
      .populate("therapistId", "name email")
      .populate("serviceId", "name")
      .populate("ritualPurchaseId");
    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("clientId", "name email")
      .populate("therapistId", "name email")
      .populate("serviceId", "name")
      .populate("ritualPurchaseId");

    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }
    res.json({ success: true, booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


module.exports = {
  getAllBookings,
  getBookingById,
};
