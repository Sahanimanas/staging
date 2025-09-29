const Booking = require("../../../models/BookingSchema");

const COMMISSION_RATE = 0.35; // 35%

const calculateBookingMetrics = (booking) => {
  const amount = booking.price?.amount || 0;
  const companyShare = amount * COMMISSION_RATE;
  const therapistShare = amount * (1 - COMMISSION_RATE);
  const netSettlement =
    booking.paymentMode === "online"
      ? therapistShare // ✅ Payable (Online)
      : -companyShare; // ✅ Receivable (Cash)

  return {
    companyShare,
    therapistShare,
    netSettlement,
  };
};

// ✅ Helper to normalize date range to UTC
const getUtcDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

const getBookingWiseReport = async (req, res) => {
  const {
    startDate,
    endDate,
    settlementStatus,
    serviceId,
    paymentMode,
    page = 1,
    limit = 20,
  } = req.query;

  const therapistId = req.params.therapistId || req.query.therapistId;

  const pageNumber = parseInt(page) > 0 ? parseInt(page) : 1;
  const pageLimit = parseInt(limit) > 0 ? parseInt(limit) : 20;
  const skip = (pageNumber - 1) * pageLimit;

  const query = { status: "completed" };

  // ✅ Settlement status filter
  if (settlementStatus === "Pending") {
    query.$or = [{ settlementId: null }, { settlementId: { $exists: false } }];
  } else if (settlementStatus === "Settled") {
    query.settlementId = { $ne: null, $exists: true };
  }

  // ✅ Date range filter (always UTC)
  if (startDate && endDate) {
    const { start, end } = getUtcDateRange(startDate, endDate);
    query.slotEnd = { $gte: start, $lte: end };
  }

  // ✅ Therapist filter
  if (therapistId && therapistId !== "null") {
    query.therapistId = therapistId;
  }

  // ✅ Service filter
  if (serviceId && serviceId !== "null") {
    query.serviceId = serviceId;
  }

  // ✅ Payment mode filter (e.g. "online" or "cash")
  if (paymentMode && paymentMode !== "null") {
    query.paymentMode = paymentMode.toLowerCase();
  }

  try {
    // Pagination count
    const totalCount = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate("clientId", "name avatar_url")
      .populate("therapistId", "title")
      .populate("serviceId", "name")
      .skip(skip)
      .limit(pageLimit)
      .sort({ slotEnd: -1 })
      .lean();

    const reportData = bookings.map((booking) => {
      const metrics = calculateBookingMetrics(booking);
      const isSettled = !!booking.settlementId;

      return {
        bookingId: booking._id,
        clientName: booking.clientId?.name || "Unknown Client",
        therapist: booking.therapistId?.title || "Unknown Therapist",
        service: booking.serviceId?.name || "Unknown Service",
        amount: booking.price?.amount || 0,
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
    console.error("Error fetching booking-wise report:", error);
    res.status(500).json({
      message: "Error fetching booking-wise report",
      error: error.message,
    });
  }
};

module.exports = getBookingWiseReport;
