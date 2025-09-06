const express = require('express'); 
const router = express.Router();

router.put('/:userId/address', require('../controller/client/Address/userAddress.js'));
router.get('/:userId/bookings', require('../controller/client/profile/booking.js'));
router.get('/:userId/alladdress', require('../controller/client/Address/getAddress.js'));
router.post('/:userId/default', require('../controller/client/Address/defaultAddress.js'));
module.exports = router;