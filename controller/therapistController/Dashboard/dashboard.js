const Booking = require("../../../models/BookingSchema");
const TherapistProfile = require("../../../models/TherapistProfiles");
const mongoose = require("mongoose");

async function getTherapistAverageRating(therapistId) {
  // Convert to ObjectId if therapistId is string
  const objectId = new mongoose.Types.ObjectId(therapistId);

  const result = await Booking.aggregate([
    {
      $match: {
        therapistId: objectId,
        status: "completed",
        "review.rating": { $exists: true, $ne: null } // only include with rating
      }
    },
    {
      $group: {
        _id: "$therapistId",
        avgRating: { $avg: "$review.rating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (result.length === 0) {
    return { avgRating: 0, totalReviews: 0 }; // no reviews found
  }

  return {
    avgRating: result[0].avgRating.toFixed(1), // round to 1 decimal place
    totalReviews: result[0].totalReviews
  };
}

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

  // Start of the week (Sunday, 00:00:00 UTC)
  weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay());
  weekStart.setUTCHours(0, 0, 0, 0);

  // End of the week (Saturday, 23:59:59 UTC)
  todayEnd = new Date(weekStart);
  todayEnd.setUTCDate(weekStart.getUTCDate() + 6); // go to Saturday
  todayEnd.setUTCHours(23, 59, 59, 999);

  // Today start (if you need today's data only)
  todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

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
console.log(todayStart,todayEnd)
    // ✅ Today's Sessions (or range sessions)
    const todaysSessions = await Booking.countDocuments({
      therapistId,
      status: "confirmed",
      date: { $gte: todayStart, $lte: todayEnd },
    }) || null;

    // ✅ Pending Requests
    const pendingRequests = await Booking.countDocuments({
      therapistId,
      status: "pending",
    }) || null;

    // ✅ This Week Sessions (or extended range sessions)
    const weekSessions = await Booking.countDocuments({
      therapistId,
      status: "confirmed",
      date: { $gte: weekStart, $lte: todayEnd },
    }) || null;

    // ✅ Therapist Profile
     const { avgRating, totalReviews } = await getTherapistAverageRating(therapistId);

console.log(`⭐ Average Rating: ${avgRating} (${totalReviews} reviews)`);
// Output: ⭐ Average Rating: 4.7 (12 reviews)


    // ✅ Revenue Generated
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          therapistId: new mongoose.Types.ObjectId(therapistId),
          status: "completed",
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
      averageRating: avgRating,
      totalRevenue,
      totalReviews
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = dashboard;
