const Booking = require("../../models/BookingSchema");

const dashboard = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    const totalBookings = await Booking.countDocuments();
    const upcoming = await Booking.countDocuments({
      appointmentDate: { $gte: now, $lte: sevenDaysLater }
    });
    const completed = await Booking.countDocuments({ status: "completed" });
    const cancelled = await Booking.countDocuments({ status: "cancelled" });
   const revenueAgg = await Booking.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: null, total: { $sum: "$price.amount" } } }
]);

const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    const completionRate = totalBookings ? ((completed / totalBookings) * 100).toFixed(2) : 0;
    const cancellationRate = totalBookings ? ((cancelled / totalBookings) * 100).toFixed(2) : 0;

    res.json({
      totalBookings,
      upcoming,
      completed,
      cancelled,
      revenue,
      completionRate: `${completionRate}%`,
      cancellationRate: `${cancellationRate}%`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = dashboard;
