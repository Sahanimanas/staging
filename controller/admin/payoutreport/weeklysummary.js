const TherapistSettlement = require("../../../models/TherapistSettlement");
const Booking = require("../../../models/BookingSchema");

const COMMISSION_RATE = 0.35; // 35%

const getWeeklySettlementSummary = async (req, res) => {
  const {
    startDate,
    endDate,
    therapistId,
    settlementStatus,
    page = 1,
    limit = 20,
  } = req.query;

  try {
    const pageNum = parseInt(page) > 0 ? parseInt(page) : 1;
    const pageSize = parseInt(limit) > 0 ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * pageSize;

    // --- 1. Fetch weekly settlements (PENDING + SETTLED) ---
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
    if (settlementStatus && settlementStatus !== "null") {
      settlementQuery.status = settlementStatus.toUpperCase();
    } else {
      settlementQuery.status = { $in: ["PENDING", "SETTLED"] };
    }

    const settlements = await TherapistSettlement.find(settlementQuery)
      .populate("therapistId", "title")
      .sort({ periodEnd: 1 })
      .lean();

    // --- 2. Fetch bookings (unsettled + individually settled) ---
    const bookingQuery = {
      status: "completed",
      $or: [
        { settlementId: null }, // Not yet settled
        { settlementId: { $exists: true } }, // Individually settled
      ],
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

    // --- 3. Group bookings by therapist ---
    const groupedBookings = {};
    bookings.forEach((b) => {
      if (!b.therapistId) return;
      const tId = b.therapistId._id.toString();
      if (!groupedBookings[tId]) {
        groupedBookings[tId] = {
          settlementId: b.settlementId || null,
          therapistId: tId,
          therapist: b.therapistId.title,
          totalBookings: 0,
          totalOnlineReceived: 0,
          totalCashCollected: 0,
          totalCommission: 0,
          totalOnlinePayable: 0,
          totalCashReceivable: 0,
          netSettlement: 0,
          settlementStatus: b.settlementId ? "SETTLED" : "PENDING",
          actions: b.settlementId ? ["View Only"] : ["Settle Now"],
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

    const liveBookingData = Object.values(groupedBookings).filter(
      (t) => t.totalBookings > 0
    );

    // --- 4. Format weekly settlements ---
    const formattedSettlements = settlements.map((s) => ({
      settlementId: s._id,
      therapistId: s.therapistId?._id,
      therapist: s.therapistId?.name || "Unknown Therapist",
      totalBookings: s.totalBookings || 0,
      totalOnlinePayable: s.payableToTherapist || 0,
      totalCashReceivable: s.receivableFromTherapist || 0,
      netSettlement: s.netSettlementAmount || 0,
      settlementStatus: s.status,
      actions:
        s.status === "PENDING"
          ? ["Settle Now", "Adjust Next Week"]
          : ["View Only"],
    }));

    // --- 5. Merge weekly settlements + individual/live bookings ---
    const finalData = [...formattedSettlements, ...liveBookingData];

    // --- 6. Pagination ---
    const paginatedData = finalData.slice(skip, skip + pageSize);

    res.status(200).json({
      message: "Weekly settlement summary retrieved.",
      count: finalData.length,
      data: paginatedData,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: finalData.length,
        totalPages: Math.ceil(finalData.length / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching weekly summary:", error);
    res.status(500).json({
      message: "Error fetching weekly summary",
      error: error.message,
    });
  }
};

module.exports = getWeeklySettlementSummary;
