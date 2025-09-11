

const  getTherapists  = require('../controller/therapistController/GetTherapist/getTherapists.js');

const express = require('express');
const authMiddleware = require('../models/middlewares/authtoken.js');
const router = express.Router();

router.post("/filter",getTherapists);

router.post('/addavailability',require('../controller/therapistController/schedule/addAvailabilty'));
router.post('/addtherapist',require('../controller/therapistController/Add&DeleteTherapist/Addtherapist.js'));

router.get('/getalltherapists',require('../controller/therapistController/GetTherapist/therapis(accept=true).js'));
router.post('/date',require('../controller/therapistController/schedule/deleteAvailabilty').deleteAvailabilityByDate);
router.post('/blocks',require('../controller/therapistController/schedule/deleteAvailabilty').deleteAvailabilityBlocks);
router.get('/availability/:id',require('../controller/therapistController/schedule/getAvailabilityById.js'));
router.post('/availability/copy',require('../controller/therapistController/schedule/copyavailability.js'));
router.get("/dashboard/:therapistId",require('../controller/therapistController/Dashboard/dashboard.js'));
router.post('/bookings/revenue',require('../controller/therapistController/Dashboard/revenue.js'));
router.post("/reset", require('../models/middlewares/verifyTherapist.js'), require('../controller/therapistController/schedule/DeleteEntireMonth.js'));
router.post('/next7days',require('../controller/therapistController/schedule/next7days.js'));
router.get('/filter', require('../controller/therapistController/GetTherapist/getbypostalcode.js'));
// router.post('/therapistprofile',require('../controller/therapistController/Profile/Profile.js'));

//by Therapist flow

router.get('/list', require('../controller/therapistController/GetTherapist/bytherpist/getTherapist.js'));
router.get('/:therapistId/services', require('../controller/services/therapistServices.js'));
router.put('/edittherapist/:therapistId',authMiddleware, require('../controller/therapistController/Profile/editprofile.js'));



//edit profile
//pending
// router.post('/edit/:therapistId', require('../controller/therapistController/Profile/editProfile.js'));

//bookings
router.get('/getbookings',authMiddleware, require('../controller/therapistController/booking/booking.js'));
router.put('/completebooking/:bookingId',authMiddleware, require('../controller/therapistController/booking/updatebooking.js').MarkComplete);
router.put('/decline/:bookingId',authMiddleware, require('../controller/therapistController/booking/updatebooking.js').declineBooking);
//get by id
router.get('/:id', require('../controller/therapistController/GetTherapist/therapistByID.js'));
module.exports = router;

