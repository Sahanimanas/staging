const express = require('express');
const router = express.Router();

const registerUser = require('../controller/client/registerUser.js');
const login_User = require('../controller/client/userlogin.js');


router.post('/register',registerUser);
router.post('/login',login_User);
module.exports = router;
