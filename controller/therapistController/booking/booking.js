const Booking = require("../../../models/BookingSchema.js");
const TherapistProfiles = require("../../../models/TherapistProfiles.js");

const bookingUser = async (req, res) => {
  const userId = req.user._id;
  const therapist = await TherapistProfiles.findOne({ userId:userId });
  if(!therapist){
    return res.status(404).json({ error: "Therapist not found" });
  }
  const therapistId = therapist._id.toString();
  console.log(therapistId)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    // Validate therapistId length
    if (!therapistId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid therapistId" });
    }

    // Find all bookings for this therapist
    const bookings = await Booking.find({ therapistId })
      .populate("clientId") // populate client's info
      .populate("serviceId") // populate service info
      .sort({ createdAt: -1 })
      .lean();
  const totalBookings = bookings.length;
    const totalPages = Math.ceil(totalBookings / limit);
    const paginatedBookings = bookings.slice(skip, skip + limit);

    res.json({  totalPages ,bookings: paginatedBookings,});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = bookingUser;