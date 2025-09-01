const TherapistAvailability = require("../../../models/AvailabilitySchema");

// ✅ Route to reset therapist availability for an entire requested month
const resetTherapistSchedule = async (req, res) => {
  try {
    const { therapistId, year, month } = req.body; // frontend must send therapistId, year, month (0-indexed month)
    const loggedInTherapistId = req.therapistProfileId;

    if (therapistId !== loggedInTherapistId) {
      return res.status(403).json({ message: "Unauthorized action." });
    }

    if (!year || month === undefined) {
      return res.status(400).json({ message: "year and month are required." });
    }

    // Calculate first and last day of requested month
    const monthStart = new Date(year, month-1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month , 0, 23, 59, 59, 999);

    const result = await TherapistAvailability.deleteMany({
      therapistId,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    res.json({
      message: `Schedule reset for ${monthStart.toDateString()} → ${monthEnd.toDateString()}`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error resetting schedule:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = resetTherapistSchedule;
