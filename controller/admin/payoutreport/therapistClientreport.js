const Booking = require("../../../models/BookingSchema");

const COMMISSION_RATE = 0.35; // 35%

const calculateBookingMetrics = (booking) => {
  const amount = booking.price?.amount || 0;
  const companyShare = amount * COMMISSION_RATE;
  const therapistShare = amount * (1 - COMMISSION_RATE);
  const netSettlement =
    booking.paymentMode === "online"
      ? therapistShare // +65% (Payable)
      : -companyShare; // -35% (Receivable)

  const status = booking.settlementId ? "Settled" : "Pending";

  return {
    companyShare,
    therapistShare,
    netSettlement,
    status,
  };
};

// ✅ Helper to convert local date to UTC range
const getUtcDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0); // Beginning of day UTC

  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999); // End of day UTC

  return { start, end };
};

const getBookingWiseReport = async (req, res) => {
  const {
    startDate,
    endDate,
    settlementStatus,
    therapistId,
    page = 1,
    limit = 20,
  } = req.query;

  const pageNumber = parseInt(page) > 0 ? parseInt(page) : 1;
  const pageLimit = parseInt(limit) > 0 ? parseInt(limit) : 20;
  const skip = (pageNumber - 1) * pageLimit;

  const query = { status: "completed" };

  // Settlement filter
  if (settlementStatus === "Pending") {
    query.$or = [{ settlementId: null }, { settlementId: { $exists: false } }];
  } else if (settlementStatus === "Settled") {
    query.settlementId = { $ne: null, $exists: true };
  }

  // ✅ Date range filter with UTC normalization
  if (startDate && endDate) {
    const { start, end } = getUtcDateRange(startDate, endDate);
    query.slotEnd = { $gte: start, $lte: end };
  }

  // Therapist filter (optional)
  if (therapistId && therapistId !== "null") {
    query.therapistId = therapistId;
  }

  try {
    // Count for pagination
    const totalCount = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate("clientId", "name avatar_url")
      .populate("therapistId", "title")
      .populate("serviceId", "name")
      .skip(skip)
      .limit(pageLimit)
      .sort({ slotEnd: -1 })
      .exec();

    const reportData = bookings.map((booking) => {
      const metrics = calculateBookingMetrics(booking);
      const isSettled = !!booking.settlementId;

      return {
        bookingId: booking._id,
        clientName: booking.clientId?.name || "Unknown Client",
        therapist: booking.therapistId?.title || "Unknown Therapist",
        service: booking.serviceId?.name || "Unknown Service",
        amount: booking.price?.amount,
        paymentMode: booking.paymentMode,
        companyShare: metrics.companyShare,
        therapistShare: metrics.therapistShare,
        netSettlement: metrics.netSettlement,
        status: isSettled ? "Settled" : "Pending",
        actions: isSettled ? ["Settled"] : ["Mark Settled"],
      };
    });

    res.status(200).json({
      message: "Booking-wise settlement report retrieved.",
      page: pageNumber,
      limit: pageLimit,
      totalCount,
      totalPages: Math.ceil(totalCount / pageLimit),
      data: reportData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching booking-wise report",
      error: error.message,
    });
  }
};

module.exports = getBookingWiseReport;
