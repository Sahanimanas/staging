

const express = require('express');
const router = express.Router();

const verifyadmin = require('../models/middlewares/verifyadmin.js');   
const dashboard = require('../controller/admin/dashboard.js');
const authMiddleware = require('../models/middlewares/authtoken.js');

// Admin profile

router.get('/profile',authMiddleware,require('../controller/admin/adminProfile/getProfile.js'))
router.put('/editprofile', authMiddleware, require('../controller/admin/adminProfile/editprofile'))
router.get('/adminlist',authMiddleware,require('../controller/admin/admin management/getAdmin'))
//therapist Routes
router.get('/therapist',  require('../controller/therapistController/GetTherapist/admin_get_therapsit.js'));
router.delete('/therapist/:id',require('../controller/therapistController/Add&DeleteTherapist/deletetherapist.js'));
router.get('/therapist/list', require('../controller/admin/therpist management/alltherapist.js'));
router.post('/createtherapist', require('./Admin/createTherpist.js'));
router.post('/therapist/bulkaction', require('../controller/admin/therpist management/bulkAction.js'));
router.put('/updatetherapist/:therapistId',authMiddleware, require('../controller/admin/therpist management/editProfile.js'))
//service Routes
router.post('/addservices', require('../controller/admin/service management/addService.js'));
router.delete('/deleteservices/:id', require('../controller/admin/service management/deleteService.js'));
router.put('/editservices/:id', require('../controller/admin/service management/editService.js'));
router.get('/services/list', require('../controller/services/massageServices.js'));
router.post('/postalcode', require('../controller/admin/addlocation.js'));
router.get('/services/:id', require('../controller/admin/service management/serviceById.js'));

//bookings
router.get('/bookings', require('../controller/booking/get_booking.js').getAllBookings);
router.get('/dashboard', verifyadmin, dashboard);
router.get('/revenue', require('../controller/admin/revenue.js'));
router.get('/bookings/therapist/:therapistId', require('../controller/admin/bookingbytherapist.js'));

//users management
router.get('/users', require('../controller/admin/usermanagement/users.js'));

//admin management
router.post('/createadmin',authMiddleware, require('../controller/admin/admin management/addAdmin.js'))

module.exports = router;
