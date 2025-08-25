const TherapistAvailability = require("../../../models/AvailabilitySchema.js");

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

    // ✅ Normalize date (start of the day)
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // ✅ Find existing availability for that date
    let availability = await TherapistAvailability.findOne({ therapistId, date: normalizedDate });

    if (availability) {
      // ✅ Merge blocks without duplicates
      const existingBlocks = availability.blocks.map(b => `${b.start}-${b.end}`);
      const newBlocks = [];

      for (const block of blocks) {
        const key = `${block.start}-${block.end}`;
        if (!existingBlocks.includes(key)) {
          newBlocks.push(block);
        }
      }

      if (newBlocks.length === 0) {
        return res.status(200).json({ message: "No new slots added. All blocks already exist.", availability });
      }

      availability.blocks = [...availability.blocks, ...newBlocks];
      await availability.save();

      return res.status(200).json({
        message: "New availability blocks added successfully",
        addedBlocks: newBlocks,
        availability
      });
    }

    // ✅ Create new availability if none exists
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
