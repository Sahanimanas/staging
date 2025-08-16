const login_User = require('../controller/login_AllRole.js');
const express = require('express');
const router = express.Router();

router.post('/login', login_User);

module.exports = router;
