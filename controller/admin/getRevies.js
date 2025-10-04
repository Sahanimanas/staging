const Booking = require("../../models/BookingSchema");
const Therapist = require("../../models/TherapistProfiles");

const getReviews = async (req, res) => {
  try {
    // Fetch only bookings that have a review
    const bookingsWithReviews = await Booking.find(
      { "review.rating": { $exists: true, $ne: null } },
      { _id: 1, therapistId: 1, review: 1, serviceId: 1, date: 1 }
    )
      .populate("serviceId", "name") 
      .populate('therapistId', 'title')
      .populate('clientId', "name")
      .lean();

    // Format reviews for frontend
    const formattedReviews = bookingsWithReviews.map((b) => ({
      bookingId: b._id,
      therapist: b.therapistId.title || "therapist",
      rating: b.review?.rating || 0,
      comment: b.review?.Comment || "No comment",
      selectedServices: b.serviceId?.name || "N/A",
      serviceDate: b.date ? b.date.toISOString().split('T')[0] : null,
      user: b.clientId.name

    }));

    res.json({ reviews: formattedReviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = getReviews;
