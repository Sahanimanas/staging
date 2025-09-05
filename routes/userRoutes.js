const express = require('express'); 
const router = express.Router();

router.put('/:userId/address', require('../controller/client/add/userAddress.js'));
router.get('/:userId/bookings', require('../controller/client/profile/booking.js'));
module.exports = router;