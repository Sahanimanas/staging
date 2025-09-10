const Booking = require("../../../models/BookingSchema");

const getBookings = async (req, res) => {
  try {
    // Optional filters (e.g., by client, therapist, status)
    const { bookingId } = req.params;
    const filter = {};
const _id = bookingId;
  
    // Populate references for better response
    const bookings = await Booking.findById({_id:_id})
      .populate("clientId", "name email phone")  // returns basic user info
      .populate("therapistId", "title") // returns therapist info
      .populate("serviceId", "name duration options.price.amount")
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json({
      success: true,
    
      data: bookings,
    });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ success: false, message: "Failed to fetch bookings", error: err.message });
  }
};

module.exports =  getBookings;
