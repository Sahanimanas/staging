const login_Therapist = require('../controller/login_AllRole.js');
const  getTherapists  = require('../controller/therapistController/getTherapists.js');

const express = require('express');
const router = express.Router();

router.post('/login',login_Therapist);
//filtered therapist list

router.post("/filter",getTherapists);



module.exports = router;
