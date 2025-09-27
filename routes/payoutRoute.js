const express = require('express');
const router = express.Router();


router.get('/admin/summary', require('../controller/admin/payout/adminPayout').getWeeklySettlementReport);
router.get('/therapist/summary/:therapistId',require('../controller/admin/payout/therapistPayout'))

router.get('/admin/reports/booking-wise',require('../controller/admin/payoutreport/therapistClientreport'))
router.get('/admin/reports/weekly-summary',require('../controller/admin/payoutreport/weeklysummary'))


module.exports = router