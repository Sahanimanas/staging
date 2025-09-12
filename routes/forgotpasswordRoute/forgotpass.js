
const express = require('express'); 
const router = express.Router();

router.post('/forgot-password', require('../../Handlers/forgot-password.js'));
router.post('/reset-password', require('../../Handlers/Resetlink.js'));

module.exports = router;