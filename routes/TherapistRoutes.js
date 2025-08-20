const login_Therapist = require('../controller/therapistController/therapistlogin.js');
const  getTherapists  = require('../controller/therapistController/getTherapists.js');

const express = require('express');
const router = express.Router();

router.post('/login',login_Therapist);
//filtered therapist list

router.post("/filter",getTherapists);



module.exports = router;
