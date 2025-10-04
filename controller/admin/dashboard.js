const Booking = require("../../models/BookingSchema");
const Therapist = require("../../models/TherapistProfiles.js");

const getDashboardStats = async (req, res) => {
  try {
    const { filter } = req.query;
    let startDate, endDate;
    let dateCondition = {};

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (filter === "today") {
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setUTCHours(23, 59, 59, 999);
      dateCondition = { $gte: startDate, $lte: endDate };
    } else if (filter === "week") {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      firstDayOfWeek.setUTCHours(0, 0, 0, 0);

      const lastDayOfWeek = new Date(today);
      lastDayOfWeek.setDate(today.getDate() + (6 - today.getDay()));
      lastDayOfWeek.setUTCHours(23, 59, 59, 999);

      startDate = firstDayOfWeek;
      endDate = lastDayOfWeek;
      dateCondition = { $gte: startDate, $lte: endDate };
    } else if (filter === "month") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setUTCHours(23, 59, 59, 999);
      dateCondition = { $gte: startDate, $lte: endDate };
    } else if (filter === "all") {
      // For "all" filter, we don’t restrict by date
      dateCondition = {}; 
    } else {
      return res.status(400).json({ error: "Invalid filter" });
    }

    // Total bookings in the range (or all time)
    const totalBookings = await Booking.countDocuments(
      Object.keys(dateCondition).length ? { createdAt: dateCondition } : {}
    );

    const activeTherapists = await Therapist.countDocuments({ active: true });
    
    // Completed sessions (in the date range or all time)
    const todaysSessions = await Booking.countDocuments(
      Object.keys(dateCondition).length
        ? { date: dateCondition, status: "confirmed" }
        : { status: "confirmed" }
    );

    // Declined bookings
    const declinedBookings = await Booking.countDocuments(
      Object.keys(dateCondition).length
        ? { createdAt: dateCondition, status: "declined" }
        : { status: "declined" }
    );

    // Cancelled bookings
    const cancelledBookings = await Booking.countDocuments(
      Object.keys(dateCondition).length
        ? { createdAt: dateCondition, status: "cancelled" }
        : { status: "cancelled" }
    );

    // Upcoming sessions (always future bookings)
    const upcoming = await Booking.countDocuments({
      date: { $gte: new Date() },
      status: "pending",
    });

    // Revenue for completed bookings
    const revenueAgg = await Booking.aggregate([
      {
        $match: Object.keys(dateCondition).length
          ? { date: dateCondition, status: "completed" }
          : { status: "completed" },
      },
      { $group: { _id: null, total: { $sum: "$price.amount" } } },
    ]);

    let revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;
    revenue = Math.round(revenue * 0.35 * 100) / 100;

    return res.json({
      totalBookings,
      activeTherapists,
      todaysSessions,
      declinedBookings,
      cancelledBookings,
      upcoming,
      revenue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = getDashboardStats;
