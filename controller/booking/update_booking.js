const Booking = require('../../models/BookingSchema');


// Cancel Booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Find booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    // Prevent cancelling if already completed or cancelled
    if (booking.status === "completed") {
      return res.status(400).json({ success: false, error: "Cannot cancel a completed booking" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, error: "Booking is already cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ success: true, message: "Booking cancelled successfully", booking });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// utils/dateUtils.js
function toUTC(dateString) {
  return new Date(dateString).toISOString(); // ISO is always UTC
}


const rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { slotStart } = req.body;

    if (!slotStart) {
      return res.status(400).json({
        success: false,
        error: "New slotStart is required for rescheduling",
      });
    }

    // Find booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    // Prevent rescheduling if already cancelled or completed
    if (booking.status === "completed") {
      return res.status(400).json({ success: false, error: "Cannot reschedule a completed booking" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, error: "Cannot reschedule a cancelled booking" });
    }

    // Ensure existing slotStart/slotEnd are Date objects
    const oldStart = booking.slotStart instanceof Date ? booking.slotStart : new Date(booking.slotStart);
    const oldEnd   = booking.slotEnd instanceof Date   ? booking.slotEnd   : new Date(booking.slotEnd);

    if (isNaN(oldStart.getTime()) || isNaN(oldEnd.getTime())) {
      return res.status(500).json({ success: false, error: "Existing booking has invalid date fields" });
    }

    // Duration in ms (preserve it)
    const durationMs = oldEnd.getTime() - oldStart.getTime();
    if (durationMs <= 0) {
      return res.status(500).json({ success: false, error: "Existing booking duration is invalid" });
    }

    // Parse incoming slotStart into a Date object (and treat ambiguous strings as UTC)
    let newSlotStartUTC;
    if (slotStart instanceof Date) {
      newSlotStartUTC = slotStart;
    } else if (typeof slotStart === "number") {
      // epoch ms
      newSlotStartUTC = new Date(slotStart);
    } else if (typeof slotStart === "string") {
      // If string contains timezone (Z or +hh:mm/-hh:mm) parse as-is.
      // If it has no timezone, append 'Z' to treat it as UTC (avoid local-time surprises).
      const hasTZ = /[zZ]|[+\-]\d{2}:\d{2}$/.test(slotStart);
      newSlotStartUTC = new Date(hasTZ ? slotStart : slotStart + "Z");
    } else {
      return res.status(400).json({ success: false, error: "slotStart must be a Date, epoch(ms) or ISO string" });
    }

    if (isNaN(newSlotStartUTC.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid slotStart date" });
    }

    // Auto-calc slotEnd keeping same duration
    const newSlotEndUTC = new Date(newSlotStartUTC.getTime() + durationMs);

    // Extract date (midnight UTC of that day)
    const newDateUTC = new Date(Date.UTC(
      newSlotStartUTC.getUTCFullYear(),
      newSlotStartUTC.getUTCMonth(),
      newSlotStartUTC.getUTCDate()
    ));

    // Update and save
    booking.date = newDateUTC;
    booking.slotStart = newSlotStartUTC;
    booking.slotEnd = newSlotEndUTC;
    booking.status = "confirmed";

    await booking.save();

    return res.json({
      success: true,
      message: "Booking rescheduled successfully",
      booking: {
        ...booking.toObject(),
        date: booking.date.toISOString(),
        slotStart: booking.slotStart.toISOString(),
        slotEnd: booking.slotEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error rescheduling booking:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};


module.exports = { cancelBooking ,  rescheduleBooking};

 

