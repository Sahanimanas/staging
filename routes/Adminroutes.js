

const express = require('express');
const router = express.Router();

const verifyadmin = require('../models/middlewares/verifyadmin.js');   
const dashboard = require('../controller/admin/dashboard.js');
router.get('/dashboard', verifyadmin, dashboard);

router.get('/therapist',  require('../controller/therapistController/GetTherapist/admin_get_therapsit.js'));
router.delete('/therapist/:id',require('../controller/therapistController/Add&DeleteTherapist/deletetherapist.js'));

//therapist Routes
router.get('/therapist/list', require('../controller/admin/therpist management/alltherapist.js'));

router.post('/therapist/bulkaction', require('../controller/admin/therpist management/bulkAction.js'));
//service Routes
router.post('/addservices', require('../controller/admin/service management/addService.js'));
router.delete('/deleteservices/:id', require('../controller/admin/service management/deleteService.js'));
router.put('/editservices/:id', require('../controller/admin/service management/editService.js'));
router.get('/services/list', require('../controller/services/massageServices.js'));
router.post('/postalcode', require('../controller/admin/addlocation.js'));
module.exports = router;
