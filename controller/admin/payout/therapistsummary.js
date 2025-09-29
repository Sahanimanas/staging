const TherapistSettlement = require("../../../models/TherapistSettlement");
const Booking = require("../../../models/BookingSchema");

const COMMISSION_RATE = 0.35;

const getTherapistWeeklySummary = async (req, res) => {
  const {
    startDate,
    endDate,
    therapistId,
    settlementStatus,
    page = 1,
    limit = 20,
  } = req.query;

  try {
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;

    /* ------------------ 1. Build settlement query ------------------ */
    const settlementQuery = { settlementType: "WEEKLY" };

    if (startDate && endDate) {
      settlementQuery.periodEnd = {
        $gte: new Date(`${startDate}T00:00:00.000Z`),
        $lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    if (therapistId && therapistId !== "null") {
      settlementQuery.therapistId = therapistId;
    }

    const settlements = await TherapistSettlement.find(settlementQuery)
      .populate("therapistId", "title")
      .sort({ periodEnd: 1 })
      .lean();

    /* ------------------ 2. Format Settlements ------------------ */
    let formattedSettlements = settlements.map((s) => ({
      settlementId: s._id,
      therapistId: s.therapistId?._id,
      therapist: s.therapistId?.title || "Unknown Therapist",
      totalBookings: s.totalBookings || 0,
      totalOnlinePayable: s.payableToTherapist || 0,
      totalCashReceivable: s.receivableFromTherapist || 0,
      netSettlement: s.netSettlementAmount || 0,
      settlementStatus: s.status,
      settledDate: s.settledDate || null,
      actions:
        s.status === "PENDING"
          ? ["Settle Now", "Adjust Next Week"]
          : ["View Only"],
    }));

    // ✅ Filter by settlement status if provided
    if (settlementStatus && settlementStatus !== "null") {
      formattedSettlements = formattedSettlements.filter(
        (s) => s.settlementStatus === settlementStatus.toUpperCase()
      );
    }

    /* ------------------ 3. Live bookings for unsettled therapists ------------------ */
    const settledTherapistIds = new Set(
      formattedSettlements.map((s) => s.therapistId?.toString())
    );

    const bookingQuery = {
      status: "completed",
      settlementId: null, // ✅ only unsettled bookings
    };

    if (startDate && endDate) {
      bookingQuery.slotEnd = {
        $gte: new Date(`${startDate}T00:00:00.000Z`),
        $lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    if (therapistId && therapistId !== "null") {
      bookingQuery.therapistId = therapistId;
    }

    const bookings = await Booking.find(bookingQuery)
      .populate("therapistId", "title")
      .lean();

    const groupedBookings = {};
    bookings.forEach((b) => {
      if (!b.therapistId) return;
      const tId = b.therapistId._id.toString();

      if (!groupedBookings[tId]) {
        groupedBookings[tId] = {
          settlementId: null,
          therapistId: tId,
          therapist: b.therapistId.title,
          totalBookings: 0,
          totalOnlineReceived: 0,
          totalCashCollected: 0,
          totalCommission: 0,
          totalOnlinePayable: 0,
          totalCashReceivable: 0,
          netSettlement: 0,
          settlementStatus: "PENDING",
          settledDate: null,
          actions: ["Settle Now"],
        };
      }

      const amount = b.price?.amount || 0;
      const commission = amount * COMMISSION_RATE;
      const therapistShare = amount - commission;

      groupedBookings[tId].totalBookings++;
      groupedBookings[tId].totalCommission += commission;

      if (b.paymentMode === "online") {
        groupedBookings[tId].totalOnlineReceived += amount;
        groupedBookings[tId].totalOnlinePayable += therapistShare;
        groupedBookings[tId].netSettlement += therapistShare;
      } else {
        groupedBookings[tId].totalCashCollected += amount;
        groupedBookings[tId].totalCashReceivable += commission;
        groupedBookings[tId].netSettlement -= commission;
      }
    });

    const liveBookingData = Object.values(groupedBookings);

    /* ------------------ 4. Merge & Paginate ------------------ */
    const finalData = [...formattedSettlements, ...liveBookingData];

    // ✅ Also include total bookings (settled + pending) for each therapist
    const therapistTotals = {};
    finalData.forEach((row) => {
      if (!therapistTotals[row.therapistId]) {
        therapistTotals[row.therapistId] = row.totalBookings;
      } else {
        therapistTotals[row.therapistId] += row.totalBookings;
      }
    });

    const enrichedData = finalData.map((row) => ({
      ...row,
      totalBookingsOverall: therapistTotals[row.therapistId],
    }));

    const paginatedData = enrichedData.slice(skip, skip + pageSize);

    res.status(200).json({
      message: "Therapist weekly settlement summary retrieved successfully.",
      count: enrichedData.length,
      data: paginatedData,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: enrichedData.length,
        totalPages: Math.ceil(enrichedData.length / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching therapist weekly summary:", error);
    res.status(500).json({
      message: "Error fetching therapist weekly summary",
      error: error.message,
    });
  }
};

module.exports = getTherapistWeeklySummary;
