
const  getTherapists  = require('../controller/therapistController/GetTherapist/getTherapists.js');

const express = require('express');
const router = express.Router();

router.post("/filter",getTherapists);

router.post('/addavailability',require('../controller/therapistController/schedule/addAvailabilty'));
router.post('/addtherapist',require('../controller/therapistController/Add&DeleteTherapist/Addtherapist.js'));
router.delete('/:id',require('../controller/therapistController/Add&DeleteTherapist/deletetherapist.js'));
router.get('/getalltherapists',require('../controller/therapistController/GetTherapist/getAllTherapists.js'));
router.delete('/date',require('../controller/therapistController/schedule/deleteAvailabilty').deleteAvailabilityByDate);
router.delete('/blocks',require('../controller/therapistController/schedule/deleteAvailabilty').deleteAvailabilityBlocks);
router.get('/availability/:id',require('../controller/therapistController/schedule/getAvailabilityById.js'));
router.post('/availability/copy',require('../controller/therapistController/schedule/copyavailability.js'));
router.get("/dashboard/:therapistId",require('../controller/therapistController/Dashboard/dashboard.js'));
module.exports = router;
