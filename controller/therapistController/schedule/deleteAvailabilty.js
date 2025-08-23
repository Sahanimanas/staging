const TherapistAvailability = require("../../../models/AvailabilitySchema.js");

/**
 * Delete entire availability for a specific date
 */
const deleteAvailabilityByDate = async (req, res) => {
  try {
    const { therapistId, date } = req.body;

    if (!therapistId || !date) {
      return res.status(400).json({ error: "therapistId and date are required" });
    }

    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const deleted = await TherapistAvailability.findOneAndDelete({
      therapistId,
      date: normalizedDate
    });

    if (!deleted) {
      return res.status(404).json({ message: "No availability found for the given date" });
    }

    return res.status(200).json({
      message: "Entire availability for the date deleted successfully",
      deleted
    });
  } catch (error) {
    console.error("Error deleting availability:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Delete specific time blocks from availability for a date
 */
const deleteAvailabilityBlocks = async (req, res) => {
  try {
    const { therapistId, date, blocksToDelete } = req.body;

    if (!therapistId || !date || !Array.isArray(blocksToDelete) || blocksToDelete.length === 0) {
      return res.status(400).json({ error: "therapistId, date, and blocksToDelete array are required" });
    }

    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const availability = await TherapistAvailability.findOne({ therapistId, date: normalizedDate });

    if (!availability) {
      return res.status(404).json({ message: "No availability found for the given date" });
    }

    // Remove specified blocks
    availability.blocks = availability.blocks.filter(
      (block) => !blocksToDelete.some(
        (delBlock) => delBlock.startTime === block.startTime && delBlock.endTime === block.endTime
      )
    );

    // If no blocks left after deletion, remove the entire record
    if (availability.blocks.length === 0) {
      await TherapistAvailability.deleteOne({ therapistId, date: normalizedDate });
      return res.status(200).json({ message: "All blocks deleted. Availability removed for the date." });
    }

    await availability.save();

    return res.status(200).json({
      message: "Specified blocks deleted successfully",
      availability
    });
  } catch (error) {
    console.error("Error deleting blocks:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { deleteAvailabilityByDate, deleteAvailabilityBlocks };
