const login_Therapist = require('../controller/login_AllRole.js');
const checkRole = require('../middlewares/admin.js');
const express = require('express');
const router = express.Router();

router.post('/login',login_Therapist);

module.exports = router;
