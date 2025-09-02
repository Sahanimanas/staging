

const express = require('express');
const router = express.Router();
const verifyadmin = require('../models/middlewares/verifyadmin.js');   
const dashboard = require('../controller/admin/dashboard.js');
router.get('/dashboard', verifyadmin, dashboard);
router.post('/addservices', verifyadmin, require('../controller/services/addservices.js'));
router.get('/therapist',  require('../controller/therapistController/GetTherapist/admin_get_therapsit.js'));
module.exports = router;
