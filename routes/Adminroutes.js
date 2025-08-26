
const express = require('express');
const router = express.Router();
const verifyadmin = require('../middlewares/verifyadmin.js');   
const dashboard = require('../controller/admin/dashboard.js');
router.get('/dashboard', verifyadmin, dashboard);

module.exports = router;
