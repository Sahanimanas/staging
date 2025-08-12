const registerUser = require('../controller/registerUser.js');
const checkRole = require('../middlewares/admin.js');
const express = require('express');
const router = express.Router();

router.post('/register', registerUser);

module.exports = router;
