

const  getTherapists  = require('../controller/therapistController/GetTherapist/getTherapists.js');

const express = require('express');
const router = express.Router();

router.post("/filter",getTherapists);

router.post('/addavailability',require('../controller/therapistController/schedule/addAvailabilty'));
router.post('/addtherapist',require('../controller/therapistController/Add&DeleteTherapist/Addtherapist.js'));
router.delete('/:id',require('../controller/therapistController/Add&DeleteTherapist/deletetherapist.js'));
router.get('/getalltherapists',require('../controller/therapistController/GetTherapist/getAllTherapists.js'));
router.post('/date',require('../controller/therapistController/schedule/deleteAvailabilty').deleteAvailabilityByDate);
router.post('/blocks',require('../controller/therapistController/schedule/deleteAvailabilty').deleteAvailabilityBlocks);
router.get('/availability/:id',require('../controller/therapistController/schedule/getAvailabilityById.js'));
router.post('/availability/copy',require('../controller/therapistController/schedule/copyavailability.js'));
router.get("/dashboard/:therapistId",require('../controller/therapistController/Dashboard/dashboard.js'));
router.post('/bookings/revenue',require('../controller/therapistController/Dashboard/revenue.js'));
router.post("/reset", require('../models/middlewares/verifyTherapist.js'), require('../controller/therapistController/schedule/DeleteEntireMonth.js'));
router.post('/next7days',require('../controller/therapistController/schedule/next7days.js'));
router.get('/filter', require('../controller/therapistController/GetTherapist/getbypostalcode.js'));
router.post('/therapistprofile',require('../controller/therapistController/Profile.js'));

//by Therapist flow

router.get('/list', require('../controller/therapistController/GetTherapist/bytherpist/getTherapist.js'));
router.get('/:therapistId/services', require('../controller/services/therapistServices.js'));

module.exports = router;

