const Booking = require('../../models/Booking');

const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};
module.exports = updateBooking;

