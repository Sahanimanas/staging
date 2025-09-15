

const express = require('express');
const router = express.Router();

const verifyadmin = require('../models/middlewares/verifyadmin.js');   
const dashboard = require('../controller/admin/dashboard.js');
const authMiddleware = require('../models/middlewares/authtoken.js');

// Admin profile

router.get('/profile',verifyadmin, authMiddleware , require('../controller/admin/adminProfile/getProfile.js'))
router.put('/editprofile',verifyadmin, authMiddleware, require('../controller/admin/adminProfile/editprofile'))
router.get('/adminlist', verifyadmin, authMiddleware,require('../controller/admin/admin management/getAdmin'))
//therapist Routes
router.get('/therapist', verifyadmin ,  require('../controller/therapistController/GetTherapist/admin_get_therapsit.js'));
router.delete('/therapist/:id', verifyadmin ,  require('../controller/therapistController/Add&DeleteTherapist/deletetherapist.js'));
router.get('/therapist/list', verifyadmin ,  require('../controller/admin/therpist management/alltherapist.js'));
router.post('/createtherapist', verifyadmin ,  require('./Admin/createTherpist.js'));
router.post('/therapist/bulkaction', verifyadmin ,  require('../controller/admin/therpist management/bulkAction.js'));
router.put('/updatetherapist/:therapistId', verifyadmin ,  authMiddleware, require('../controller/admin/therpist management/editProfile.js'))
//service Routes
router.post('/addservices', verifyadmin ,  require('../controller/admin/service management/addService.js'));
router.delete('/deleteservices/:id', verifyadmin ,   require('../controller/admin/service management/deleteService.js'));
router.put('/editservices/:id', verifyadmin ,   require('../controller/admin/service management/editService.js'));
router.get('/services/list', verifyadmin ,  require('../controller/services/massageServices.js'));
router.post('/postalcode', verifyadmin ,   require('../controller/admin/addlocation.js'));
router.get('/services/:id', verifyadmin ,  require('../controller/admin/service management/serviceById.js'));

//bookings
router.get('/bookings', verifyadmin ,  require('../controller/booking/get_booking.js').getAllBookings);
router.get('/dashboard', verifyadmin, dashboard);
router.get('/revenue', verifyadmin ,   require('../controller/admin/revenue.js'));
router.get('/bookings/therapist/:therapistId', verifyadmin ,   require('../controller/admin/bookingbytherapist.js'));

//users management
router.get('/users', verifyadmin ,   require('../controller/admin/usermanagement/users.js'));

//admin management
router.post('/createadmin', authMiddleware , require('../controller/admin/admin management/addAdmin.js'))

module.exports = router;
