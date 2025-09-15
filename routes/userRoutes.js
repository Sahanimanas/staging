const express = require('express'); 
const router = express.Router();
const authtoken = require('../models/middlewares/authtoken.js');
const verifyuser = require('../models/middlewares/verifyuser')
router.put('/:userId/address' , authtoken , require('../controller/client/Address/userAddress.js'));
router.get('/:userId/bookings', authtoken , require('../controller/client/profile/booking.js'));
router.get('/:userId/alladdress', authtoken ,require('../controller/client/Address/getAddress.js'));
router.post('/:userId/default', authtoken , require('../controller/client/Address/defaultAddress.js'));

router.get('/profile',verifyuser, authtoken, require('../controller/client/profile/getProfile.js'));

router.get('/:userId/bookings', authtoken ,require('../controller/client/profile/booking.js'));

router.put('/editprofile',authtoken, authtoken, require('../controller/client/profile/editprofile.js'));

router.get('/booking/order/:bookingId', authtoken ,require('../controller/client/profile/order.js'));
router.put('/booking/:id/review', authtoken , require('../controller/client/booking.js/review.js'));
router.put('/deleteaddress/:addressId', authtoken , require('../controller/client/Address/delete'))
module.exports = router;