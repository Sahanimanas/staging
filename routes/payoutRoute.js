const express = require('express');
const router = express.Router();
const getWeeklySettlementReportInternal =require('../controller/admin/payout/adminPayout')
// const generateSettlementPDF = require('../controller/')
// {url}/api/payout/admin/marksettleweek
router.get('/admin/summary', require('../controller/admin/payout/adminPayout'));
// router.get('/therapist/summary/:therapistId',require('../controller/admin/payout/therapistPayout'))
// router.get('/admin/summary/excel', require('../controller/admin/payout/adminPayoutexcel.js'));

// router.get("/admin/weekly-settlement/pdf", async (req, res) => {
//   try {
//     // Get settlement data (internal function, not Express handler)
//     const { startDate, endDate } = req.query;
//     const reportData = await getWeeklySettlementReportInternal({
//       startDate,
//       endDate,
//     });

//     // Generate and send PDF
//     await generateSettlementPDF(reportData, res);
//   } catch (error) {
//     res.status(500).json({ message: "Error generating PDF", error: error.message });
//   }
// });

router.get('/admin/reports/booking-wise',require('../controller/admin/payoutreport/therapistClientreport'))
router.get('/admin/reports/weekly-summary',require('../controller/admin/payoutreport/weeklysummary'))

router.post('/admin/marksettlebyid', require('../controller/admin/payout/settlements/settlementbyId.js'))
router.post('/admin/marksettleweek',require('../controller/admin/payout/settlements/settlementByweek'))

//therapist payout dashboard
// /api/payout/therapist/reports/week-summary
router.get('/therapist/reports/booking-wise', require('../controller/admin/payout/therapistbookignwise'))
router.get('/therapist/reports/week-summary' , require('../controller/admin/payout/therapistsummary.js'))
module.exports = router