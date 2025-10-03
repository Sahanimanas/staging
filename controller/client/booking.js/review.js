const Booking = require("../../../models/BookingSchema");
const sendMail = require("../../../utils/sendmail");

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

const adminMail = `
  <h2>New Review Notification</h2>
  <p><strong>BookingId:</strong> ${booking._id}</p>
  <h3>Client Details</h3>
  <p><strong>Name:</strong> ${booking.clientId?.name?.first} ${booking.clientId?.name?.last}</p>
  <h3>Therapist Details</h3>
  <p><strong>Name / Title:</strong> ${booking.therapistId.title}</p>

  <h3>Booking Details</h3>
  <p><strong>Booking Date:</strong> ${booking.createdAt.toDateString()}</p>
  <p><strong>Date:</strong> ${booking.date.toDateString()}</p>
  <p><strong>Time:</strong> ${startUTC} - ${endUTC}</p>
  <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
  <p><strong>Service:</strong> ${booking.serviceId.name}</p>
  <p><strong>Price:</strong> £${booking.price.amount}</p>
  <p><strong>Payment Mode:</strong> ${booking.paymentMode}</p>
  
  <p><br>Team NOIRA</p>
`;



    await sendMail("bookings@noira.co.uk", "New Review Notification", adminMail, "booking");
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