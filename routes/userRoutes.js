const express = require('express'); 
const router = express.Router();
const authtoken = require('../models/middlewares/authtoken.js');
router.put('/:userId/address', require('../controller/client/Address/userAddress.js'));
router.get('/:userId/bookings', require('../controller/client/profile/booking.js'));
router.get('/:userId/alladdress', require('../controller/client/Address/getAddress.js'));
router.post('/:userId/default', require('../controller/client/Address/defaultAddress.js'));

router.get('/profile', authtoken, require('../controller/client/profile/getProfile.js'));

router.get('/:userId/bookings', require('../controller/client/profile/booking.js'));

router.put('/editprofile', authtoken, require('../controller/client/profile/editprofile.js'));

router.get('/booking/order/:bookingId', require('../controller/client/profile/order.js'));
router.put('/booking/:id/review', require('../controller/client/booking.js/review.js'));
router.put('/deleteaddress/:addressId',authtoken,require('../controller/client/Address/delete'))
module.exports = router;