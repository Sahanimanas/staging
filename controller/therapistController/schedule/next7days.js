const TherapistAvailability = require("../../../models/AvailabilitySchema"); // adjust path

/**
 * @desc Get future 7 days availability for a therapist
 * @route POST /api/availability/next-7-days
 * @access Private
 */
const getNext7DaysAvailability = async (req, res) => {
   try {
    const { therapistId } = req.body;
    if (!therapistId) {
      return res.status(400).json({ message: "Therapist ID is required" });
    }

    // Start date = today at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End date = today + 6 days
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 6);

    // Fetch availability from DB
    const dbAvailability = await TherapistAvailability.find({
      therapistId,
      date: { $gte: today, $lte: endDate }
    }).lean();

    // Map DB results by YYYY-MM-DD for quick lookup
    const availabilityMap = {};
    dbAvailability.forEach(item => {
      const dateKey = item.date.toISOString().split("T")[0];
      availabilityMap[dateKey] = item;
    });

    // Build 7-day array
    const availability = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateKey = currentDate.toISOString().split("T")[0];

      if (availabilityMap[dateKey]) {
        availability.push({
          date: currentDate,
          blocks: availabilityMap[dateKey].blocks.filter(b => b.isAvailable),
          isAvailable: availabilityMap[dateKey].blocks.some(b => b.isAvailable)
        });
      } else {
        availability.push({
          date: currentDate,
          blocks: [],
          isAvailable: false
        });
      }
    }

    res.status(200).json({
      therapistId,
      range: { start: today, end: endDate },
      availability
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = getNext7DaysAvailability;
