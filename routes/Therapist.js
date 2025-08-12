const login = require('../controller/login.js');
const checkRole = require('../middlewares/admin.js');
const express = require('express');
const router = express.Router();

router.post('/login',checkRole(['admin', 'therapist']), login.loginAdminOrTherapist);

module.exports = router;
