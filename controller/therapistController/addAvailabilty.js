const TherapistAvailability = require("../../models/AvailabilitySchema.js");

/**
 * Add or update therapist availability for a specific date
 */
const addAvailability = async (req, res) => {
  try {
    const { therapistId, date, blocks } = req.body;

    // ✅ Validate input
    if (!therapistId || !date || !blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return res.status(400).json({ error: "therapistId, date, and blocks are required" });
    }

    // ✅ Convert date to start of the day (for consistency)
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // ✅ Check if availability for the date already exists
    let availability = await TherapistAvailability.findOne({ therapistId, date: normalizedDate });

    if (availability) {
      // Update existing availability blocks
      availability.blocks = blocks;
      await availability.save();
      return res.status(200).json({ message: "Availability updated successfully", availability });
    }

    // ✅ Create new availability record
    availability = new TherapistAvailability({
      therapistId,
      date: normalizedDate,
      blocks
    });

    await availability.save();
    return res.status(201).json({ message: "Availability added successfully", availability });
  } catch (error) {
    console.error("Error adding availability:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = addAvailability;
