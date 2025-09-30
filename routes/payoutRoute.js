const express = require('express');
const router = express.Router();
const getWeeklySettlementReportInternal =require('../controller/test')
const generateTherapistInvoice = require('../controller/invoicePdf.js')

router.get('/admin/summary', require('../controller/admin/payout/adminPayout'));

const path = require("path");
const fs = require("fs");
router.get("/admin/weekly-settlement/pdf", async (req, res) => {
  try {
    const { startDate, endDate, therapistId } = req.query;

    // Fetch report data
    const reportData = await getWeeklySettlementReportInternal(
      startDate,
      endDate,
      therapistId
    );

    // Set headers so browser treats it as a downloadable PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Noira_Invoice_${therapistId}.pdf`
    );

    // Generate PDF and pipe directly to response
    const doc = generateTherapistInvoice(reportData);
    doc.pipe(res);  // stream PDF directly to frontend
    doc.end();      // finalize PDF

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
});

router.get('/admin/reports/booking-wise',require('../controller/admin/payoutreport/therapistClientreport'))
router.get('/admin/reports/weekly-summary',require('../controller/admin/payoutreport/weeklysummary'))

router.post('/admin/marksettlebyid', require('../controller/admin/payout/settlements/settlementbyId.js'))
router.post('/admin/marksettleweek',require('../controller/admin/payout/settlements/settlementByweek'))

//therapist payout dashboard
// /api/payout/therapist/reports/week-summary
router.get('/therapist/reports/booking-wise', require('../controller/admin/payout/therapistbookignwise'))
router.get('/therapist/reports/week-summary' , require('../controller/admin/payout/therapistsummary.js'))
module.exports = router