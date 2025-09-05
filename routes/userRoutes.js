const express = require('express'); 
const router = express.Router();

router.put('/:userId/address', require('../controller/client/add/userAddress.js'));
module.exports = router;