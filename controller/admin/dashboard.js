const Booking = require("../../models/BookingSchema");
const Therapist = require("../../models/TherapistProfiles.js");

const getDashboardStats = async (req, res) => {
  try {
    const { filter } = req.query;
    let startDate, endDate;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (filter === "today") {
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setUTCHours(23, 59, 59, 999);
    }
     else if (filter === "week") {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      firstDayOfWeek.setUTCHours(0, 0, 0, 0);

      const lastDayOfWeek = new Date(today);
      lastDayOfWeek.setDate(today.getDate() + (6 - today.getDay()));
      lastDayOfWeek.setUTCHours(23, 59, 59, 999);

      startDate = firstDayOfWeek;
      endDate = lastDayOfWeek;
    } 
    else if (filter === "month") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setUTCHours(23, 59, 59, 999);
    } 
    else {
      return res.status(400).json({ error: "Invalid filter" });
    }

    // Common match condition
    const dateCondition = { $gte: startDate, $lte: endDate };

    // Total bookings in the range
    const totalBookings = await Booking.countDocuments({
      createdAt: dateCondition,
    });

    // Active therapists
    const activeTherapists = await Therapist.countDocuments({ active: true });

    // Completed sessions (in the date range)
    const todaysSessions = await Booking.countDocuments({
      date: dateCondition,
      status: "confirmed",
    });

    // Declined bookings in the date range
    const declinedBookings = await Booking.countDocuments({
      createdAt: dateCondition,
      status: "declined",
    });

    // Cancelled bookings in the date range
    const cancelledBookings = await Booking.countDocuments({
      createdAt: dateCondition,
      status: "cancelled",
    });

    // Upcoming sessions (future bookings)
    const upcoming = await Booking.countDocuments({
      date: { $gte: new Date() },
      status: "pending",
    });

    // Revenue for completed bookings
    const revenueAgg = await Booking.aggregate([
        {
    $match: {
      date: dateCondition,                 // ✅ use booking date, not createdAt
      status: "completed",                 // only confirmed sessions
      paymentStatus: "paid"                // only paid bookings
    },
  },
      { $group: { _id: null, total: { $sum: "$price.amount" } } },
    ]);

    const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

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

module.exports =  getDashboardStats ;
