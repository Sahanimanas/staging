const Booking = require("../../../models/BookingSchema");

// POST /booking/:id/review - add a review to a booking

const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookingId = req.params.id;

    // ✅ Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // ✅ Find and update booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Optional: prevent re-review
    if (booking.isReviewed) {
      return res.status(400).json({ message: "This booking is already reviewed" });
    }

    booking.review = {
      rating,
      Comment: comment || "",
    };
    booking.isReviewed = true;

    await booking.save();

    res.status(200).json({
      message: "Review added successfully",
      booking,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
module.exports = addReview;