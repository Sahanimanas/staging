// --- THERAPIST CONTROLLER FUNCTION ---
const Booking = require('../../../models/BookingSchema');
const TherapistSettlement = require('../../../models/TherapistSettlement');
// --- ADMIN CONTROLLER FUNCTIONS ---
// A simple function to apply the commission logic
const COMMISSION_RATE = 0.35; // 35%

const calculatePayoutMetrics = (bookings) => {
    let totalBookings = 0;
    let totalOnlineRevenue = 0;
    let totalCashRevenue = 0;

    bookings.forEach(booking => {
        // Ensure price is calculated correctly, assuming 'price' field has an 'amount' sub-field
        const bookingAmount = booking.price?.amount || 0;
        
        if (booking.status === "completed" && booking.paymentStatus === "paid") {
            totalBookings++;
            if (booking.paymentMode === 'online') {
                totalOnlineRevenue += bookingAmount;
            } else if (booking.paymentMode === 'cash') {
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
        actionRequired
    };
};
const getTherapistEarningsSummary = async (req, res) => {
    const {therapistId} = req.params; // Assumes therapist ID is in the auth token

    try {
        // 1. Get real-time metrics for UNSETTLED bookings
        const unsettledBookings = await Booking.find({
            therapistId: therapistId,
            status: "completed",
            settlementId: null // Crucially, only bookings not yet formally settled
        }).exec();
        
        const unsettledMetrics = calculatePayoutMetrics(unsettledBookings);

        // 2. Get history of all completed settlements
        const settlementHistory = await TherapistSettlement.find({
            therapistId: therapistId,
            status: "SETTLED"
        }).sort({ settlementDate: -1 }).limit(10);
        
        // Return data for the therapist's "My Earnings" page
        return res.status(200).json({
            // The amount the company owes them *now*
            pendingPayout: unsettledMetrics.netSettlementAmount,
            
            // Detailed breakdown of the pending amount
            unsettledDetails: {
                totalBookings: unsettledMetrics.totalBookings,
                onlineToReceive: unsettledMetrics.payableToTherapist, // 65% of Online
                cashToPay: unsettledMetrics.receivableFromTherapist,   // 35% of Cash
            },
            
            settlementHistory: settlementHistory
        });
        
    } catch (error) {
        res.status(500).json({ message: "Error fetching therapist earnings", error });
    }
};

module.exports = getTherapistEarningsSummary