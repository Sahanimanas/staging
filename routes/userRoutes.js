const express = require('express'); 
const router = express.Router();
const authtoken = require('../models/middlewares/authtoken.js');
router.put('/:userId/address', require('../controller/client/Address/userAddress.js'));
router.get('/:userId/bookings', require('../controller/client/profile/booking.js'));
router.get('/:userId/alladdress', require('../controller/client/Address/getAddress.js'));
router.post('/:userId/default', require('../controller/client/Address/defaultAddress.js'));

router.get('/profile', authtoken, require('../controller/client/Auth/getProfile.js'));

router.get('/:userId/bookings', require('../controller/client/profile/booking.js'));
module.exports = router;