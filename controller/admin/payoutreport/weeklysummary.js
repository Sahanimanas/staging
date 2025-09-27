// Assumed dependencies
 const TherapistSettlement = require('../../../models/TherapistSettlement');

const getWeeklySettlementSummary = async (req, res) => {
    // Filters (Date range, therapist, etc.) can be applied here
    const { startDate, endDate } = req.query;

    try {
        // 1. Fetch all PENDING weekly settlement records
        const query = { status: "PENDING", settlementType: "WEEKLY" };
        
        // Add date filtering for the period covered by the settlements
        if (startDate && endDate) {
            // This filters the settlement records themselves based on their period
            query.periodEnd = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        
        const pendingSettlements = await TherapistSettlement.find(query)
            .populate('therapistId', 'name')
            .sort({ periodEnd: 1 })
            .exec();

        // 2. Format Data
        const reportData = pendingSettlements.map(settlement => ({
            settlementId: settlement._id,
            therapist: settlement.therapistId.name,
            totalBookings: settlement.totalBookings,
            totalOnlinePayable: settlement.payableToTherapist,
            totalCashReceivable: settlement.receivableFromTherapist,
            netSettlement: settlement.netSettlementAmount,
            settlementStatus: settlement.status,
            actions: ['Settle Now', 'Adjust Next Week'] // Actions are always available for PENDING status
        }));

        res.status(200).json({
            message: "Weekly settlement summary retrieved.",
            data: reportData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching weekly summary", error: error.message });
    }
};

module.exports = getWeeklySettlementSummary