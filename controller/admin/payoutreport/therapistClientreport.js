// Assumed dependencies
const Booking = require('../../../models/BookingSchema');

const COMMISSION_RATE = 0.35; // 35%

const calculateBookingMetrics = (booking) => {
    const amount = booking.price?.amount || 0;
    const companyShare = amount * COMMISSION_RATE;
    const therapistShare = amount * (1 - COMMISSION_RATE);
    const netSettlement = booking.paymentMode === 'online' 
        ? therapistShare // +65% (Payable)
        : -companyShare; // -35% (Receivable)

    // Status check: Settled if settlementId is present
    const status = booking.settlementId ? "Settled" : "Pending";

    return {
        companyShare,
        therapistShare,
        netSettlement,
        status
    };
};
const getBookingWiseReport = async (req, res) => {
    // Admin filters: dateRange, therapistId, settlementStatus, etc.
    const { startDate, endDate, settlementStatus, therapistId } = req.query; 

    // 1. Build the Query
    const query = { status: "completed" }; 
    
    // Add filtering for settled/unsettled status
    if (settlementStatus === 'Pending') {
        // Find bookings that are null OR missing a settlementId
        query.$or = [{ settlementId: null }, { settlementId: { $exists: false } }];
    } else if (settlementStatus === 'Settled') {
        // Find bookings with a linked settlementId
        query.settlementId = { $ne: null, $exists: true };
    }
    
    // Add date range filtering (Assuming you use the UTC helper)
    if (startDate && endDate) {
        // NOTE: Use your getUtcDateRange helper here
        // const { start, end } = getUtcDateRange(startDate, endDate); 
        // query.slotEnd = { $gte: start, $lte: end };
    }
    
    if (therapistId) {
        query.therapistId = therapistId;
    }

    try {
        // 2. Execute Query and Populate related data
        const bookings = await Booking.find(query)
            .populate('clientId','name')
            .populate('therapistId', 'title') // Assuming 'name' on User or TherapistProfile
            .populate('serviceId', 'name')
            .limit(100) 
            .sort({ slotEnd: -1 })
            .exec();

        // 3. Format Data
        const reportData = bookings.map(booking => {
            const metrics = calculateBookingMetrics(booking);
            const isSettled = !!booking.settlementId; // True if settlementId exists
            
            return {
                bookingId: booking._id, 
                clientName: booking.clientId.name, // Placeholder: Requires client data lookup
                therapist: booking.therapistId.title,
                service: booking.serviceId.name,
                amount: booking.price?.amount,
                paymentMode: booking.paymentMode,
                companyShare: metrics.companyShare,
                therapistShare: metrics.therapistShare,
                netSettlement: metrics.netSettlement,
                status: isSettled ? "Settled" : "Pending",
                actions: isSettled ? ['Settled'] : ['Mark Settled'] 
            };
        });

        res.status(200).json({
            message: "Booking-wise settlement report retrieved.",
            data: reportData,
            totalCount: bookings.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching booking-wise report", error: error.message });
    }
};

module.exports = getBookingWiseReport