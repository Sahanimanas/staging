const TherapistSettlement = require("../../../../models/TherapistSettlement");
const Booking = require("../../../../models/BookingSchema");

const COMMISSION_RATE = 0.35;

const settleWeeklyBookings = async (req, res) => {
  const { startDate, endDate, therapistId } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({
      message: "startDate and endDate are required in YYYY-MM-DD format",
    });
  }

  try {
    // 1. Build booking query
    const bookingQuery = {
      status: "completed",
      settlementId: null, // Only unsettled bookings
      slotEnd: {
        $gte: new Date(`${startDate}T00:00:00.000Z`),
        $lte: new Date(`${endDate}T23:59:59.999Z`),
      },
    };

    if (therapistId) {
      bookingQuery.therapistId = therapistId;
    }

    const bookings = await Booking.find(bookingQuery)
      .populate("therapistId", "title")
      .lean();

    if (!bookings.length) {
      return res.status(200).json({
        message: "No unsettled bookings found for the given week.",
        createdSettlements: [],
      });
    }

    // 2. Group bookings per therapist
    const grouped = {};
    bookings.forEach((b) => {
      if (!b.therapistId) return;

      const tId = b.therapistId._id.toString();
      if (!grouped[tId]) {
        grouped[tId] = {
          therapistId: tId,
          therapistName: b.therapistId.title,
          bookings: [],
          totalBookings: 0,
          totalOnlinePayable: 0,
          totalCashReceivable: 0,
          netSettlementAmount: 0,
        };
      }

      const amount = b.price?.amount || 0;
      const commission = amount * COMMISSION_RATE;
      const therapistShare = amount - commission;

      grouped[tId].bookings.push(b._id);
      grouped[tId].totalBookings++;

      if (b.paymentMode === "online") {
        grouped[tId].totalOnlinePayable += therapistShare;
        grouped[tId].netSettlementAmount += therapistShare;
      } else {
        grouped[tId].totalCashReceivable += commission;
        grouped[tId].netSettlementAmount -= commission;
      }
    });

    const settledDate = new Date(); // ✅ capture settlement date in UTC

    // 3. Create settlement records for each therapist
    const settlementDocs = await TherapistSettlement.insertMany(
      Object.values(grouped).map((g) => ({
        therapistId: g.therapistId,
        settlementType: "WEEKLY",
        status: "SETTLED", // Mark as settled right away
        periodStart: new Date(`${startDate}T00:00:00.000Z`),
        periodEnd: new Date(`${endDate}T23:59:59.999Z`),
        settledDate, // ✅ store in DB
        totalBookings: g.totalBookings,
        payableToTherapist: g.totalOnlinePayable,
        receivableFromTherapist: g.totalCashReceivable,
        netSettlementAmount: g.netSettlementAmount,
      }))
    );

    // 4. Map settlementIds back to bookings
    const bookingUpdates = [];
    settlementDocs.forEach((settlement) => {
      const tId = settlement.therapistId.toString();
      if (grouped[tId]) {
        bookingUpdates.push(
          Booking.updateMany(
            { _id: { $in: grouped[tId].bookings } },
            { $set: { settlementId: settlement._id } }
          )
        );
      }
    });

    await Promise.all(bookingUpdates);

    // 5. Format response with settledDate included
    const responseData = settlementDocs.map((doc) => ({
      settlementId: doc._id,
      therapistId: doc.therapistId,
      totalBookings: doc.totalBookings,
      totalOnlinePayable: doc.payableToTherapist,
      totalCashReceivable: doc.receivableFromTherapist,
      netSettlement: doc.netSettlementAmount,
      settlementStatus: doc.status,
      settledDate: doc.settledDate, // ✅ return in response
    }));

    res.status(200).json({
      message: "Weekly settlements created and bookings marked as SETTLED.",
      createdSettlements: responseData,
    });
  } catch (error) {
    console.error("Error settling weekly bookings:", error);
    res.status(500).json({
      message: "Error settling weekly bookings",
      error: error.message,
    });
  }
};

module.exports = settleWeeklyBookings;
