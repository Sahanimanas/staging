const Booking = require("../../../models/BookingSchema");
const TherapistSettlement = require("../../../models/TherapistSettlement");
const ExcelJS = require("exceljs");

const COMMISSION_RATE = 0.35; // 35%

const calculatePayoutMetrics = (bookings) => {
  let totalBookings = 0;
  let totalOnlineRevenue = 0;
  let totalCashRevenue = 0;

  bookings.forEach((booking) => {
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

  const companyCommissionOnline = totalOnlineRevenue * COMMISSION_RATE;
  const payableToTherapist = totalOnlineRevenue * (1 - COMMISSION_RATE);
  const receivableFromTherapist = totalCashRevenue * COMMISSION_RATE;

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

const getWeeklySettlementReportExcel = async (req, res) => {
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
    // Fetch pending and settled settlements separately
    const pendingSettlements = await TherapistSettlement.find({
      settlementType: "WEEKLY",
      status: "PENDING",
      periodEnd: { $gte: start, $lte: end },
    }).populate("therapistId", "name");

    const settledSettlements = await TherapistSettlement.find({
      settlementType: "WEEKLY",
      status: "SETTLED",
      periodEnd: { $gte: start, $lte: end },
    }).populate("therapistId", "name");

    // All bookings in the date range
    const allBookings = await Booking.find({
      date: { $gte: start, $lte: end },
      status: "completed",
    });

    const globalMetrics = calculatePayoutMetrics(allBookings);

    // Excel setup
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Weekly Settlement");

    // Headers
    sheet.columns = [
      { header: "Therapist", key: "therapist", width: 25 },
      { header: "Total Bookings", key: "totalBookings", width: 15 },
      { header: "Payable to Therapist", key: "payable", width: 20 },
      { header: "Receivable from Therapist", key: "receivable", width: 20 },
      { header: "Net Settlement", key: "net", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Add pending settlements
    pendingSettlements.forEach((s) => {
      sheet.addRow({
        therapist: s.therapistId?.name || "Unknown",
        totalBookings: s.totalBookings,
        payable: s.payableToTherapist,
        receivable: s.receivableFromTherapist,
        net: s.netSettlementAmount,
        status: s.status,
      });
    });

    // Add settled settlements
    settledSettlements.forEach((s) => {
      sheet.addRow({
        therapist: s.therapistId?.name || "Unknown",
        totalBookings: s.totalBookings,
        payable: s.payableToTherapist,
        receivable: s.receivableFromTherapist,
        net: s.netSettlementAmount,
        status: s.status,
      });
    });

    // Add a blank row
    sheet.addRow({});

    // Add totals
    sheet.addRow({
      therapist: "TOTAL",
      totalBookings: globalMetrics.totalBookings,
      payable: globalMetrics.payableToTherapist,
      receivable: globalMetrics.receivableFromTherapist,
      net: globalMetrics.netSettlementAmount,
      status: "",
    });

    // Set bold for headers and total row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(sheet.rowCount).font = { bold: true };

    // Send file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=weekly_settlement_${startDate}_to_${endDate}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({ message: "Error generating Excel", error });
  }
};

module.exports = getWeeklySettlementReportExcel;
