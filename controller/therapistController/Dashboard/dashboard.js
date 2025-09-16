const Booking = require("../../../models/BookingSchema");
const TherapistProfile = require("../../../models/TherapistProfiles");
const mongoose = require("mongoose");

const dashboard = async (req, res) => {
  try {
    const { therapistId } = req.params;
    const { filter, startDate, endDate } = req.body;

    if (!therapistId) {
      return res.status(400).json({ error: "therapistId is required" });
    }

    let todayStart = new Date();
    let todayEnd = new Date();
    let weekStart = new Date();

    // ✅ Determine date ranges based on filter
    switch (filter) {
      case "today":
        todayStart.setUTCHours(0, 0, 0, 0);
        todayEnd.setUTCHours(23, 59, 59, 999);
        weekStart = new Date(todayStart);
        weekStart.setUTCDate(todayStart.getUTCDate() - todayStart.getUTCDay());
        break;

      case "week": {
        const now = new Date();
        todayEnd = new Date(now);
        todayEnd.setUTCHours(23, 59, 59, 999);
        weekStart = new Date(now);
        weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay());
        weekStart.setUTCHours(0, 0, 0, 0);
        todayStart = new Date(weekStart); // so todaysSessions counts from weekStart
        break;
      }

      case "month": {
        const now = new Date();
        todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
        todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        weekStart = new Date(todayStart); // so weekSessions covers full month
        break;
      }


      case "custom":
        if (!startDate || !endDate) {
          return res.status(400).json({ error: "startDate and endDate are required for custom filter" });
        }
        todayStart = new Date(startDate);
        todayEnd = new Date(endDate);
        todayStart.setUTCHours(0, 0, 0, 0);
        todayEnd.setUTCHours(23, 59, 59, 999);
        weekStart = new Date(todayStart);
        break;

      default:
        todayStart.setUTCHours(0, 0, 0, 0);
        todayEnd.setUTCHours(23, 59, 59, 999);
        weekStart = new Date(todayStart);
        weekStart.setUTCDate(todayStart.getUTCDate() - todayStart.getUTCDay());
        break;
    }

    // ✅ Today's Sessions (or range sessions)
    const todaysSessions = await Booking.countDocuments({
      therapistId,
      status: "confirmed",
      date: { $gte: todayStart, $lte: todayEnd },
    }) || null;

    // ✅ Pending Requests
    const pendingRequests = await Booking.countDocuments({
      therapistId,
      paymentStatus: "pending",
    }) || null;

    // ✅ This Week Sessions (or extended range sessions)
    const weekSessions = await Booking.countDocuments({
      therapistId,
      status: "confirmed",
      date: { $gte: weekStart, $lte: todayEnd },
    }) || null;

    // ✅ Therapist Profile
    const therapist = await TherapistProfile.findById(therapistId, "rating ratingCount");

    // ✅ Revenue Generated
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          therapistId: new mongoose.Types.ObjectId(therapistId),
          status: "confirmed",
          date: { $gte: weekStart, $lte: todayEnd },
        },
      },
      { $group: { _id: null, totalRevenue: { $sum: "$price.amount" } } },
    ]) || null;

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      todaysSessions,
      pendingRequests,
      weekSessions,
      averageRating: therapist ? therapist.rating : 0,
      totalRevenue,
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = dashboard;
