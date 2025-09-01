
const Booking = require("../../../models/BookingSchema");
const TherapistProfile = require("../../../models/TherapistProfiles");

const mongoose = require("mongoose");   

// ✅ Dashboard API
const dashboard = async (req, res) => {
  try {
    const { therapistId } = req.params;
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay()); // start of week

    // Today's Sessions
    const todaysSessions = await Booking.countDocuments({
      therapistId,
      status: "confirmed",
      date: { $gte: todayStart, $lte: todayEnd },
    }) || null;

    // Pending Requests
    const pendingRequests = await Booking.countDocuments({
      therapistId,
      paymentStatus: "pending",
    })|| null;


    // This Week Sessions
    const weekSessions = await Booking.countDocuments({
      therapistId,
      status: "confirmed",
      date: { $gte: weekStart, $lte: todayEnd },
    })|| null;


    // Therapist Profile
    const therapist = await TherapistProfile.findById(therapistId, "rating ratingCount");

    // ✅ Revenue Generated
    const revenueResult = await Booking.aggregate([
      { $match: { therapistId: new mongoose.Types.ObjectId(therapistId), status: "confirmed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$price.amount" } } },
    ])|| null;

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
console.log(totalRevenue)
    res.json({
      todaysSessions,
      pendingRequests,
      weekSessions,
      averageRating: therapist ? therapist.rating : 0,
      totalRevenue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = dashboard;
