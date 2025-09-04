

const express = require('express');
const router = express.Router();

const verifyadmin = require('../models/middlewares/verifyadmin.js');   
const dashboard = require('../controller/admin/dashboard.js');
router.get('/dashboard', verifyadmin, dashboard);
router.post('/addservices', require('../controller/admin/service management/addService.js'));
router.get('/therapist',  require('../controller/therapistController/GetTherapist/admin_get_therapsit.js'));
router.delete('/therapist/:id',require('../controller/therapistController/Add&DeleteTherapist/deletetherapist.js'));

//get therapist list
router.get('/therapist/list', require('../controller/admin/therpist management/alltherapist.js'));
//therapist delete
router.post('/therapist/bulkaction', require('../controller/admin/therpist management/bulkAction.js'));
module.exports = router;
