const express = require('express');
const router = express.Router();

const registerUser = require('../controller/registerUser.js');
const login_User = require('../controller/login_AllRole.js');


router.post('/register',registerUser);
router.post('/login',login_User);
module.exports = router;
