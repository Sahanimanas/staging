const TherapistAvailability = require("../../../models/AvailabilitySchema.js");

/**
 * Copy therapist availability to multiple dates based on copyType
 */
const copyAvailability = async (req, res) => {
  try {
    const { therapistId, baseDate, blocks, copyType } = req.body;

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

    // normalize baseDate
    const startDate = new Date(baseDate);
    startDate.setUTCHours(0, 0, 0, 0);

    // generate all target dates
    const targetDates = getTargetDates(startDate, copyType);
    if (targetDates.length === 0) {
      return res.status(400).json({ error: "No dates generated for this copyType" });
    }

    // fetch existing availabilities
    const existingAvailabilities = await TherapistAvailability.find({
      therapistId,
      date: { $in: targetDates }
    });

    const existingMap = {};
    existingAvailabilities.forEach(avail => {
      existingMap[avail.date.toISOString()] = avail;
    });

    const bulkOps = [];
    const skippedInvalid = [];
    const skippedConflicts = [];

    // helper to convert time string → minutes
    const toMinutes = (time) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    // helper: validate & filter incoming blocks
    const validateBlocks = (blocksArr, existingArr = []) => {
      const valid = [];
      const sorted = [...blocksArr].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

      for (let i = 0; i < sorted.length; i++) {
        const block = sorted[i];
        const start = toMinutes(block.startTime);
        const end = toMinutes(block.endTime);

        if (end <= start) {
          skippedInvalid.push(block);
          continue;
        }

        // check conflict with already accepted new blocks
        const conflictWithNew = valid.some(b => {
          const bStart = toMinutes(b.startTime);
          const bEnd = toMinutes(b.endTime);
          return start < bEnd && end > bStart;
        });

        // check conflict with existing blocks (if provided)
        const conflictWithExisting = existingArr.some(b => {
          const bStart = toMinutes(b.startTime);
          const bEnd = toMinutes(b.endTime);
          return start < bEnd && end > bStart;
        });

        if (conflictWithNew || conflictWithExisting) {
          skippedConflicts.push(block);
          continue;
        }

        valid.push(block);
      }

      return valid;
    };

    // process each date
    for (const date of targetDates) {
      const dateKey = date.toISOString();
      const existing = existingMap[dateKey];

      if (existing) {
        // validate new blocks against existing
        const validatedBlocks = validateBlocks(blocks, existing.blocks);

        if (validatedBlocks.length > 0) {
          const merged = [...existing.blocks, ...validatedBlocks];
          bulkOps.push({
            updateOne: {
              filter: { therapistId, date },
              update: { $set: { blocks: merged } }
            }
          });
        }
      } else {
        // validate only new blocks
        const validatedBlocks = validateBlocks(blocks, []);
        if (validatedBlocks.length > 0) {
          bulkOps.push({
            insertOne: {
              document: {
                therapistId,
                date,
                blocks: validatedBlocks
              }
            }
          });
        }
      }
    }

    if (bulkOps.length > 0) {
      await TherapistAvailability.bulkWrite(bulkOps);
    }

    return res.status(200).json({
      message: `Availability copied to ${targetDates.length} dates (${copyType}) successfully`,
      totalDates: targetDates.length,
      skippedInvalid,
      skippedConflicts
    });
  } catch (error) {
    console.error("Error copying availability:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

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
        const weekday = date.getUTCDay();
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
     const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

for (let d = 1; d <= daysInMonth; d++) {
  const date = new Date(Date.UTC(year, month, d));
  dates.push(date); // already UTC midnight
}

      break;
    }

    default:
      break;
  }

  return dates;
}

module.exports = copyAvailability;
