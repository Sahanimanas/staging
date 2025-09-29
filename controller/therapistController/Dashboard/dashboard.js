const Booking = require("../../../models/BookingSchema");
const mongoose = require("mongoose");

async function getTherapistAverageRating(therapistId) {
  const objectId = new mongoose.Types.ObjectId(therapistId);

  const result = await Booking.aggregate([
    {
      $match: {
        therapistId: objectId,
        status: "completed",
        "review.rating": { $exists: true, $ne: null }
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
    return { avgRating: 0, totalReviews: 0 };
  }

  return {
    avgRating: result[0].avgRating.toFixed(1),
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

    const now = new Date();

    // ✅ Today Range
    let todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    let todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);

    // ✅ Week Range (last 7 days ending yesterday)
    const yesterday = new Date();
    yesterday.setUTCDate(now.getUTCDate() - 1);
    yesterday.setUTCHours(23, 59, 59, 999);

    const weekStart = new Date();
    weekStart.setUTCDate(yesterday.getUTCDate() - 6); // 7 days inclusive
    weekStart.setUTCHours(0, 0, 0, 0);

    // ✅ Month Range
    let monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    let monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    let isCustom = false;
    let customSessions = { confirmed: 0, completed: 0 };

    // ✅ Override ranges if filter is provided
    if (filter === "week") {
      todayStart = weekStart;
      todayEnd = yesterday;
    } else if (filter === "month") {
      todayStart = monthStart;
      todayEnd = monthEnd;
    } else if (filter === "custom") {
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required for custom filter" });
      }
      isCustom = true;
      todayStart = new Date(startDate);
      todayEnd = new Date(endDate);
      todayStart.setUTCHours(0, 0, 0, 0);
      todayEnd.setUTCHours(23, 59, 59, 999);

      // ✅ Count confirmed + completed for custom range
      customSessions.confirmed = await Booking.countDocuments({
        therapistId,
        status: "confirmed",
        date: { $gte: todayStart, $lte: todayEnd },
      });

      customSessions.completed = await Booking.countDocuments({
        therapistId,
        status: "completed",
        date: { $gte: todayStart, $lte: todayEnd },
      });
    }

    // ✅ Today's Sessions
    const todaysSessions = {
      confirmed: await Booking.countDocuments({
        therapistId,
        status: "confirmed",
        date: { $gte: todayStart, $lte: todayEnd },
      }),
      completed: await Booking.countDocuments({
        therapistId,
        status: "completed",
        date: { $gte: todayStart, $lte: todayEnd },
      }),
    };

    // ✅ Pending Requests (all confirmed regardless of date)
    const pendingRequests = await Booking.countDocuments({
      therapistId,
      status: "confirmed",
    });

    // ✅ Week Sessions
    const weekSessions = {
      confirmed: await Booking.countDocuments({
        therapistId,
        status: "confirmed",
        date: { $gte: weekStart, $lte: yesterday },
      }),
      completed: await Booking.countDocuments({
        therapistId,
        status: "completed",
        date: { $gte: weekStart, $lte: yesterday },
      }),
    };

    // ✅ Month Sessions
    const monthSessions = {
      confirmed: await Booking.countDocuments({
        therapistId,
        status: "confirmed",
        date: { $gte: monthStart, $lte: monthEnd },
      }),
      completed: await Booking.countDocuments({
        therapistId,
        status: "completed",
        date: { $gte: monthStart, $lte: monthEnd },
      }),
    };

    // ✅ Therapist Rating + Total Reviews
    const { avgRating, totalReviews } = await getTherapistAverageRating(therapistId);

    // ✅ Revenue Generated (same range as filter)
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          therapistId: new mongoose.Types.ObjectId(therapistId),
          status: "completed",
          date: { $gte: todayStart, $lte: todayEnd },
        },
      },
      { $group: { _id: null, totalRevenue: { $sum: "$price.amount" } } },
    ]);

    let totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    totalRevenue = totalRevenue * 0.65; // therapist share
    totalRevenue = Math.round(totalRevenue * 100) / 100;

    res.json({
      todaysSessions,
      pendingRequests,
      weekSessions,
      monthSessions,
      ...(isCustom && { customSessions }),
      averageRating: avgRating,
      totalRevenue,
      totalReviews,
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = dashboard;
