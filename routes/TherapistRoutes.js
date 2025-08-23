const login_Therapist = require('../controller/therapistController/therapistlogin.js');
const  getTherapists  = require('../controller/therapistController/getTherapists.js');

const express = require('express');
const router = express.Router();

router.post('/login',login_Therapist);
router.post("/filter",getTherapists);
router.post('/addAvailability',require('../controller/therapistController/addAvailabilty'));
router.post('/addTherapist',require('../controller/therapistController/Addtherapist'));
router.delete('/:id',require('../controller/therapistController/deletetherapist'));
router.get('/getAllTherapists',require('../controller/therapistController/getAllTherapists'));
router.post('/deleteAvailabilityByDate',require('../controller/therapistController/deleteAvailabilty').deleteAvailabilityByDate);
router.post('/deleteAvailabilityBlocks',require('../controller/therapistController/deleteAvailabilty').deleteAvailabilityBlocks);
// router.get('/gettherapist/:id',require('../controller/therapistController/getTherapistById'));
module.exports = router;
