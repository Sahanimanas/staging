const Booking = require("../../../models/BookingSchema");
const TherapistSettlement = require("../../../models/TherapistSettlement");
// ... other requires (TherapistProfile, etc.)

// --- ADMIN CONTROLLER FUNCTIONS ---
// A simple function to apply the commission logic
const COMMISSION_RATE = 0.35; // 35%

const calculatePayoutMetrics = (bookings) => {
  let totalBookings = 0;
  let totalOnlineRevenue = 0;
  let totalCashRevenue = 0;

  bookings.forEach((booking) => {
    // Ensure price is calculated correctly, assuming 'price' field has an 'amount' sub-field
    const bookingAmount = booking.price?.amount || 0;

    if (booking.status === "completed" && booking.paymentStatus === "paid") {
      totalBookings++;
      if (booking.paymentMode === "online") {
        totalOnlineRevenue += bookingAmount;
      } else if (booking.paymentMode === "cash") {
        totalCashRevenue += bookingAmount;
      }
    }
  });

  // Commission Logic
  const companyCommissionOnline = totalOnlineRevenue * COMMISSION_RATE;
  const payableToTherapist = totalOnlineRevenue * (1 - COMMISSION_RATE); // 65% of Online

  const receivableFromTherapist = totalCashRevenue * COMMISSION_RATE; // 35% of Cash

  // Net Calculation
  const netSettlementAmount = payableToTherapist - receivableFromTherapist;
  const actionRequired =
    netSettlementAmount > 0
      ? "PAY_THERAPIST"
      : netSettlementAmount < 0
      ? "COLLECT_FROM_THERAPIST"
      : "NET_ZERO";

  return {
    totalBookings,
    totalOnlineRevenue,
    totalCashRevenue,
    companyCommissionOnline,
    payableToTherapist,
    receivableFromTherapist,
    netSettlementAmount,
    actionRequired,
  };
};
// 1. Weekly Settlement Report Generation (The main report view)
const getWeeklySettlementReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  const getUtcDateRange = (startDateStr, endDateStr) => {
    const start = new Date(startDateStr);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(endDateStr);
    end.setUTCHours(23, 59, 59, 999);

    return { start, end };
  };

  const { start, end } = getUtcDateRange(startDate, endDate);

  try {
    const pendingSettlements = await TherapistSettlement.find({
      settlementType: "WEEKLY",
      status: "PENDING",
      periodEnd: { $gte: new Date(startDate) },
    }).populate("therapistId", "name");

    const allBookings = await Booking.find({
      date: {
        $gte: start,
        $lte: end,
      },
      status: "completed",
    }).exec();
    console.log(allBookings);
    const globalMetrics = calculatePayoutMetrics(allBookings);
    return res.status(200).json({
      dateRange: `${startDate} to ${endDate}`,
      summaryMetrics: {
        totalBookings: globalMetrics.totalBookings,
        companyCommission:
          globalMetrics.companyCommissionOnline +
          globalMetrics.receivableFromTherapist,
        therapistEarnings:
          globalMetrics.payableToTherapist + globalMetrics.totalCashRevenue, // Simplified view of therapist earnings
        netPayable: globalMetrics.payableToTherapist,
        netReceivable: globalMetrics.receivableFromTherapist,
      },
      weeklySettlementSummary: pendingSettlements, // Use the generated/pending settlements
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching settlement report", error });
  }
};

const settleTherapistWeek = async (req, res) => {
  const { settlementId } = req.params;
  const updatedSettlement = await TherapistSettlement.findByIdAndUpdate(
    settlementId,
    {
      status: "SETTLED",
      settlementDate: new Date(),
      settlementRef: req.body.transactionRef, // UTR/Transaction ID
    },
    { new: true }
  );
  await Booking.updateMany(
    { _id: { $in: updatedSettlement.includedBookingIds } },
    { $set: { settlementId: settlementId } }
  );

  res.status(200).json(updatedSettlement);
};
module.exports = { getWeeklySettlementReport, settleTherapistWeek };
