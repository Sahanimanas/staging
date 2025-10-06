const TherapistAvailability = require("../../../models/AvailabilitySchema");

const getTherapistScheduleTrend = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;

    // 🕒 Default to last 7 days (including today) if no range is provided
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);

    if (!startDate || !endDate) {
      const lastWeek = new Date(today);
      lastWeek.setUTCDate(today.getUTCDate() - 6); // include today (7 days total)
      lastWeek.setUTCHours(0, 0, 0, 0);

      startDate = lastWeek.toISOString();
      endDate = today.toISOString();
    }

    // 🕒 Normalize given or default range to UTC
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    // 🔹 Aggregate therapist availability by UTC date
    const scheduleData = await TherapistAvailability.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          therapistId: 1,
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" },
          },
        },
      },
      {
        $group: {
          _id: "$date",
          uniqueTherapists: { $addToSet: "$therapistId" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          therapistCount: { $size: "$uniqueTherapists" },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // 🧩 Fill missing days with 0 therapists
    const result = [];
    const current = new Date(start);

    while (current <= end) {
      const utcDateStr = current.toISOString().split("T")[0];
      const found = scheduleData.find((d) => d.date === utcDateStr);

      result.push({
        date: utcDateStr,
        therapistCount: found ? found.therapistCount : 0,
      });

      current.setUTCDate(current.getUTCDate() + 1);
    }

    res.status(200).json({
      success: true,
      range: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        defaulted: !req.query.startDate || !req.query.endDate,
      },
      data: result,
    });
  } catch (error) {
    console.error("Error fetching therapist schedule trend:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = getTherapistScheduleTrend;
