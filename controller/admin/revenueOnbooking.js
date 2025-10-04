const Booking = require("../../models/BookingSchema");

const getRevenueBookings = async (req, res) => {
  try {
    const { filter } = req.query;
    let startDate, endDate;
    let dateCondition = {};

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Determine the date range based on the filter
    if (filter === "today") {
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setUTCHours(23, 59, 59, 999);
      dateCondition = { $gte: startDate, $lte: endDate };
    } else if (filter === "week") {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      firstDayOfWeek.setUTCHours(0, 0, 0, 0);

      const lastDayOfWeek = new Date(today);
      lastDayOfWeek.setDate(today.getDate() + (6 - today.getDay()));
      lastDayOfWeek.setUTCHours(23, 59, 59, 999);

      startDate = firstDayOfWeek;
      endDate = lastDayOfWeek;
      dateCondition = { $gte: startDate, $lte: endDate };
    } else if (filter === "month") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setUTCHours(23, 59, 59, 999);
      dateCondition = { $gte: startDate, $lte: endDate };
    } else if (filter === "all") {
      dateCondition = {}; // no restriction
    } else {
      return res.status(400).json({ error: "Invalid filter" });
    }

    // Build the query
    const query = Object.keys(dateCondition).length
      ? { date: dateCondition, status: "completed" }
      : { status: "completed" };

    // Fetch bookings with related details
    const bookings = await Booking.find(query)
      .populate("clientId", "name email")
      .populate("therapistId", "title specialization")
      .populate("serviceId", "name duration")
      .sort({ date: -1 }) // latest first
      .lean();

    // Compute revenue details
    let totalRevenue = 0;
    const COMMISSION_RATE = 0.35;
    const detailedBookings = bookings.map((b) => {
      const amount = b.price?.amount || 0;
      const commission = amount * COMMISSION_RATE;
      const therapistEarning = amount - commission;

      totalRevenue += amount;

      return {
        bookingId: b._id,
        client: b.clientId?.name || "N/A",
        therapist: b.therapistId?.title || "N/A",
        service: b.serviceId?.name || "N/A",
        date: b.date,
        paymentMode: b.paymentMode,
        amount,
        commission: Number(commission.toFixed(2)),
        therapistEarning: Number(therapistEarning.toFixed(2)),
        status: b.status,
      };
    });

    return res.status(200).json({
      filter,
      totalBookings: bookings.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      companyCommission: Number((totalRevenue * COMMISSION_RATE).toFixed(2)),
      totalTherapistEarnings: Number(
        (totalRevenue * (1 - COMMISSION_RATE)).toFixed(2)
      ),
      bookings: detailedBookings,
    });
  } catch (error) {
    console.error("Error fetching revenue bookings:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = getRevenueBookings;
