const Booking = require('../../models/BookingSchema');

const createBooking = async (req, res) => {
  try {
    const {
      clientId,
      therapistId,
      serviceId,
      ritualPurchaseId,
      date,
      slotStart,
      slotEnd,
      paymentStatus,
      price,
      eliteHourSurcharge,
      notes,
    } = req.body;

    // Validate required fields
    if (!clientId || !therapistId || !serviceId || !date || !slotStart || !slotEnd) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const booking = new Booking({
      clientId,
      therapistId,
      serviceId,
      ritualPurchaseId,
      date,
      slotStart,
      slotEnd,
      paymentStatus,
      price,
      eliteHourSurcharge,
      notes,
    });

    await booking.save();

    return res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking creation failed:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = createBooking;

