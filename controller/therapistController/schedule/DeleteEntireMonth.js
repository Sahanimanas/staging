
const TherapistAvailability = require("../../../models/AvailabilitySchema");

// ✅ Route
const resetTherapistSchedule = async (req, res) => {
  try {
    const { therapistId } = req.body; // coming from frontend
    const loggedInTherapistId = req.therapistProfileId;

    if (therapistId !== loggedInTherapistId) {
      return res.status(403).json({ message: "Unauthorized action." });
    }

    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const result = await TherapistAvailability.deleteMany({
      therapistId,
      date: { $gte: currentDate, $lte: monthEnd }
    });

    res.json({
      message: `Schedule reset from ${currentDate.toDateString()} to ${monthEnd.toDateString()}`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error resetting schedule:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = resetTherapistSchedule;
