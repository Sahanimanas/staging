// jobs/autoDeletePendingBookings.js
const Booking = require("../models/BookingSchema");
const TherapistAvailability = require("../models/AvailabilitySchema");

async function autoDeletePendingBookings() {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000); // 2 mins ago

  const oldBookings = await Booking.find({
    status: "pending",
    createdAt: { $lt: cutoff },
  });

  if (oldBookings.length === 0) return;

  for (const booking of oldBookings) {
    try {
      const availabilityDoc = await TherapistAvailability.findOne({
        therapistId: booking.therapistId,
        date: new Date(booking.slotStart.setUTCHours(0, 0, 0, 0)),
      });

      if (availabilityDoc) {
        const blockIndex = availabilityDoc.blocks.findIndex(
          (block) =>
            new Date(block.startTime).getTime() === booking.slotStart.getTime() &&
            new Date(block.endTime).getTime() === booking.slotEnd.getTime()
        );

        if (blockIndex !== -1) {
          availabilityDoc.blocks[blockIndex].isAvailable = true;
          await availabilityDoc.save();
          // console.log(`✅ Slot freed for booking ${booking._id}`);
        }
      }

      await Booking.findByIdAndDelete(booking._id);
      // console.log(`🗑 Deleted pending booking ${booking._id}`);
    } catch (err) {
      console.error(`❌ Failed to process booking ${booking._id}`, err.message);
    }
  }
}

// Run every 1 minute
setInterval(autoDeletePendingBookings, 60 * 1000);
