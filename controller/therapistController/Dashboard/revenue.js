const Booking = require("../../../models/BookingSchema");
const User = require("../../../models/userSchema"); // Assuming client name is stored in User model
const mongoose = require('mongoose')
/**
 * @desc Get total revenue and booking details for a date range
 * @route POST /api/bookings/revenue
 * @body { startDate: "2025-08-01", endDate: "2025-08-15" }
 */
const getRevenueReport = async (req, res) => {
  try {
      const { startDate, endDate, therapistId } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

   const start = new Date(startDate);
start.setUTCHours(0, 0, 0, 0); // Start of the day

const end = new Date(endDate);
end.setUTCHours(23, 59, 59, 999); // End of the day

const bookings = await Booking.find({
  therapistId,
  $or: [
    {
      date: { $gte: new Date(start), $lte: new Date(end) } // for Date type
    },
    {

      date: { $gte: startDate, $lte: endDate } // for String type
    }
  ]
}).populate("clientId", "name email") // Only get client name & email
  .sort({ date: 1 });

    if (!bookings.length) {
      return res.json({ totalAmount: 0, count: 0, details: [] });
    }
    // Calculate total amount & prepare detailed response
    let totalAmount = 0;
    const details = bookings.map(booking => {
      const amount = booking.price?.amount || 0;
      totalAmount += amount;

      return {
        bookingId: booking.bookingCode,
        date: booking.date,
        clientName: booking.clientId?.name || "Unknown",
        paymentAmount: amount,
      };
    });

    res.json({
      totalAmount,
      count: bookings.length,
      details
    });
  } catch (error) {
    console.error("Revenue Report Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = getRevenueReport;