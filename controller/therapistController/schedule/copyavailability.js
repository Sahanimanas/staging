const TherapistAvailability = require("../../../models/AvailabilitySchema.js");

/**
 * Copy therapist availability to multiple dates based on copyType
 */
const copyAvailability = async (req, res) => {
  try {
    const { therapistId, baseDate, blocks, copyType } = req.body;

    // Validate input
    if (
      !therapistId ||
      !baseDate ||
      !blocks ||
      !Array.isArray(blocks) ||
      blocks.length === 0 ||
      !copyType
    ) {
      return res
        .status(400)
        .json({ error: "therapistId, baseDate, blocks, and copyType are required" });
    }

    // Normalize baseDate
    const startDate = new Date(baseDate);
    startDate.setUTCHours(0, 0, 0, 0);

    // Generate target dates based on copyType
    const targetDates = getTargetDates(startDate, copyType);
    if (targetDates.length === 0) {
      return res.status(400).json({ error: "No dates generated for this copyType" });
    }

    // Fetch existing availabilities for those dates
    const existingAvailabilities = await TherapistAvailability.find({
      therapistId,
      date: { $in: targetDates }
    });

    // Map existing data by date for quick lookup
    const existingMap = {};
    existingAvailabilities.forEach(avail => {
      existingMap[avail.date.toISOString()] = avail;
    });

    const bulkOps = [];

    for (const date of targetDates) {
      const dateKey = date.toISOString();
      const existing = existingMap[dateKey];

      if (existing) {
        // Merge blocks without duplicates
        const mergedBlocks = mergeBlocks(existing.blocks, blocks);
        bulkOps.push({
          updateOne: {
            filter: { therapistId, date },
            update: { $set: { blocks: mergedBlocks } }
          }
        });
      } else {
        // Insert new document
        bulkOps.push({
          insertOne: {
            document: {
              therapistId,
              date,
              blocks: blocks
            }
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await TherapistAvailability.bulkWrite(bulkOps);
    }

    return res.status(200).json({
      message: `Availability copied to ${targetDates.length} dates (${copyType}) successfully`,
      totalDates: targetDates.length
    });
  } catch (error) {
    console.error("Error copying availability:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Merge blocks without duplicating startTime and endTime
 */
function mergeBlocks(existingBlocks, newBlocks) {
  const merged = [...existingBlocks];
  newBlocks.forEach(newBlock => {
    const isDuplicate = merged.some(
      block => block.startTime === newBlock.startTime && block.endTime === newBlock.endTime
    );
    if (!isDuplicate) {
      merged.push(newBlock);
    }
  });
  return merged;
}

/**
 * Generate target dates based on copyType
 */
function getTargetDates(baseDate, copyType) {
  const dates = [];
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();
  const day = baseDate.getUTCDate();

  switch (copyType) {
    case "next7days":
      for (let i = 0; i < 7; i++) {
        const date = new Date(baseDate);
        date.setUTCDate(day + i);
        dates.push(new Date(date.setUTCHours(0, 0, 0, 0)));
      }
      break;

    case "allweekdays": {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const weekday = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
        if (weekday >= 1 && weekday <= 5) {
          dates.push(new Date(date.setUTCHours(0, 0, 0, 0)));
        }
      }
      break;
    }

    case "allweekends": {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const weekday = date.getUTCDay();
        if (weekday === 0 || weekday === 6) {
          dates.push(new Date(date.setUTCHours(0, 0, 0, 0)));
        }
      }
      break;
    }

    case "entiremonth": {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        dates.push(new Date(date.setUTCHours(0, 0, 0, 0)));
      }
      break;
    }

    default:
      break;
  }

  return dates;
}

module.exports = copyAvailability;
