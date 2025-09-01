<<<<<<< HEAD
const express = require('express'); 
const router = express.Router();

const forgotpassword = require('../../Handlers/forgot-password.js');
const resetlink = require('../../Handlers/Resetlink.js');

router.post('/forgot-password', forgotpassword);
router.post('/reset-password', resetlink);
=======
const express = require('express'); 
const router = express.Router();

const forgotpassword = require('../../Handlers/forgot-password.js');
const resetlink = require('../../Handlers/Resetlink.js');

router.post('/forgot-password', forgotpassword);
router.post('/reset-password', resetlink);
>>>>>>> noira-backend/main
module.exports = router;