// jobs/autoDeletePendingBookings.js
const Booking = require("../models/BookingSchema");
const cron = require("node-cron");
/**
 * Auto-mark bookings as completed when their slotEnd time has passed.
 * Run this in a cron (e.g. every 5–10 minutes).
 */
const autoCompleteBookings = async (req, res) => {
  try {
    const now = new Date();

    // Find all confirmed bookings whose slotEnd < now and still not completed/cancelled/declined
    const result = await Booking.updateMany(
      {
        status: { $in: ["pending", "confirmed"] }, // only update active ones
        slotEnd: { $lt: now },
      },
      { $set: { status: "completed" } }
    );

    if (req) {
      // if called via API
      return res.status(200).json({
        message: "Auto-complete job finished.",
        matched: result.matchedCount,
        modified: result.modifiedCount,
      });
    } else {
      // if triggered internally (cron job, no req/res)
      console.log(
        `Auto-complete job: ${result.modifiedCount} bookings marked as completed.`
      );
    }
  } catch (error) {
    console.error("Error auto-completing bookings:", error);
    if (req) {
      return res.status(500).json({
        message: "Error auto-completing bookings",
        error: error.message,
      });
    }
  }
};
// ✅ Schedule job every 10 min (adjust as needed)
cron.schedule("*/10 * * * *", () => {
  autoCompleteBookings();
});
module.exports = autoCompleteBookings;
