
const  getTherapists  = require('../controller/therapistController/GetTherapist/getTherapists.js');

const express = require('express');
const router = express.Router();

router.post("/filter",getTherapists);

router.post('/addAvailability',require('../controller/therapistController/schedule/addAvailabilty'));
router.post('/addTherapist',require('../controller/therapistController/Add&DeleteTherapist/Addtherapist.js'));
router.delete('/:id',require('../controller/therapistController/Add&DeleteTherapist/deletetherapist.js'));
router.get('/getAllTherapists',require('../controller/therapistController/GetTherapist/getAllTherapists.js'));
router.post('/deleteAvailabilityByDate',require('../controller/therapistController/schedule/deleteAvailabilty').deleteAvailabilityByDate);
router.post('/deleteAvailabilityBlocks',require('../controller/therapistController/schedule/deleteAvailabilty').deleteAvailabilityBlocks);
router.get('/availability/:id',require('../controller/therapistController/schedule/getAvailabilityById.js'));

router.get("/dashboard/:therapistId",require('../controller/therapistController/Dashboard/dashboard.js'));
module.exports = router;
