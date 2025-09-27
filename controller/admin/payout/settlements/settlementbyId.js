const TherapistSettlement = require("../../../../models/TherapistSettlement");
const Booking = require("../../../../models/BookingSchema");
const mongoose = require('mongoose')

const COMMISSION_RATE = 0.35; // 35%

const markIndividualSettlement = async (req, res) => {
  const { bookingId } = req.body; // single booking

  if (!bookingId) {
    return res.status(400).json({ message: "bookingId is required." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findOne({
      _id: bookingId,
      settlementId: null,
      status: "completed",
    }).populate("therapistId", "name").lean();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or already settled." });
    }

    const amount = booking.price?.amount || 0;
    const commission = amount * COMMISSION_RATE;
    const payableToTherapist = booking.paymentMode === "online" ? amount - commission : 0;
    const receivableFromTherapist = booking.paymentMode !== "online" ? commission : 0;
    const netSettlementAmount = payableToTherapist - receivableFromTherapist;

    let actionRequired = "NET_ZERO";
    if (netSettlementAmount > 0) actionRequired = "PAY_THERAPIST";
    if (netSettlementAmount < 0) actionRequired = "COLLECT_FROM_THERAPIST";

    const settlement = await TherapistSettlement.create([{
      therapistId: booking.therapistId._id,
      settlementType: "INDIVIDUAL",
      periodStart: booking.slotStart,
      periodEnd: booking.slotEnd,
      totalBookings: 1,
      totalOnlineRevenue: booking.paymentMode === "online" ? amount : 0,
      companyCommissionOnline: booking.paymentMode === "online" ? commission : 0,
      payableToTherapist,
      totalCashRevenue: booking.paymentMode !== "online" ? amount : 0,
      receivableFromTherapist,
      netSettlementAmount,
      actionRequired,
      includedBookingIds: [booking._id],
      status: "SETTLED",
      settlementDate: new Date(),
    }], { session });

    await Booking.updateOne(
      { _id: booking._id },
      { settlementId: settlement[0]._id },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Booking settled successfully.",
      data: settlement[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error settling booking:", error);
    res.status(500).json({ message: "Error settling booking", error: error.message });
  }
};


module.exports = markIndividualSettlement