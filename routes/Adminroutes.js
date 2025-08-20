const login_User = require('../controller/admin/adminlogin');
const express = require('express');
const router = express.Router();

router.post('/login', login_User);

module.exports = router;
