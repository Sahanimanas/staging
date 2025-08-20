const Booking = require('../../models/Booking');

/* ===================== CREATE ===================== */
const createBooking = async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = createBooking;
