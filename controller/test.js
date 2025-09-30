const Booking = require("../models/BookingSchema");
const TherapistProfiles = require("../models/TherapistProfiles");

const COMMISSION_RATE = 0.35;

/**
 * Build invoice-style data for a therapist for a given date range.
 * Adds booking-level settlement status + overall settlement status.
 */
const buildTherapistInvoiceData = async (startDate, endDate, therapistId) => {
  if (!therapistId || !startDate || !endDate) {
    throw new Error("therapistId, startDate, and endDate are required");
  }

  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  // ✅ 1. Get bookings
  const bookings = await Booking.find({
    therapistId,
    status: "completed",
    slotEnd: { $gte: start, $lte: end },
  })
    .populate("clientId", "name")
    .lean();

  const therapistProfile = await TherapistProfiles.findById(therapistId).lean();

  if (!bookings.length) {
    return {
      therapistId,
      therapistName: therapistProfile?.title || "Unknown Therapist",
      period: { start: start.toISOString(), end: end.toISOString() },
      bookings: [],
      summary: {
        cash: { total: 0, therapist: 0, noira: 0 },
        online: { total: 0, therapist: 0, noira: 0 },
        netSettlement: 0,
        netNote: "No bookings in this period",
      },
      settlementStatus: "NO_BOOKINGS",
      pendingAmount: 0,
    };
  }

  // ✅ 2. Transform bookings into invoice rows
  let cashTotal = 0,
    cashTherapist = 0,
    cashNoira = 0;
  let onlineTotal = 0,
    onlineTherapist = 0,
    onlineNoira = 0;

  const rows = bookings.map((b) => {
    const amount = b.price?.amount || 0;
    const companyShare = amount * COMMISSION_RATE;
    const therapistShare = amount - companyShare;

    let note = "";
    if (b.paymentMode === "cash") {
      cashTotal += amount;
      cashTherapist += therapistShare;
      cashNoira += companyShare;
      note = `Holding £${amount} → keeps £${therapistShare.toFixed(
        2
      )}, owes £${companyShare.toFixed(2)}`;
    } else if (b.paymentMode === "online") {
      onlineTotal += amount;
      onlineTherapist += therapistShare;
      onlineNoira += companyShare;
      note = `Noira £${amount} → owes £${therapistShare.toFixed(
        2
      )}, keeps £${companyShare.toFixed(2)}`;
    }

    const isSettled = !!b.settlementId;

    return {
      bookingId: b._id,
      clientName: b.clientId?.name?.first || b.clientId?.name || "Unknown Client",
      mode: b.paymentMode,
      total: amount,
      therapistShare,
      noiraShare: companyShare,
      note,
      settlementStatus: isSettled ? "Settled" : "Pending",
    };
  });

  // ✅ 3. Build summary
  const netSettlement = onlineTherapist - cashNoira;
  const netNote =
    netSettlement >= 0
      ? `Noira owes therapist £${netSettlement.toFixed(2)}`
      : `Therapist must return £${Math.abs(netSettlement).toFixed(
          2
        )} to Noira`;

  // ✅ 4. Check overall settlement status
  const allSettled = rows.every((r) => r.settlementStatus === "Settled");
  const pendingBookings = rows.filter((r) => r.settlementStatus === "Pending");

  // Pending amount = therapist share from unsettled online + commission owed from unsettled cash
  let pendingAmount = 0;
  pendingBookings.forEach((r) => {
    if (r.mode === "online") {
      pendingAmount += r.therapistShare;
    } else if (r.mode === "cash") {
      pendingAmount += r.noiraShare;
    }
  });

  return {
    therapistId,
    therapistName: therapistProfile?.title || "Unknown Therapist",
    period: { start: start.toISOString(), end: end.toISOString() },
    bookings: rows,
    summary: {
      cash: { total: cashTotal, therapist: cashTherapist, noira: cashNoira },
      online: {
        total: onlineTotal,
        therapist: onlineTherapist,
        noira: onlineNoira,
      },
      netSettlement,
      netNote,
    },
    settlementStatus: allSettled ? "SETTLED" : "PENDING",
    pendingAmount: allSettled ? 0 : pendingAmount.toFixed(2),
  };
};

module.exports = buildTherapistInvoiceData;
