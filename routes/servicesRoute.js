
const express = require('express');
const router = express.Router();

const getAllServices = require('../controller/services/massageServices.js');
const authMiddleware = require('../models/middlewares/authtoken.js');

router.get('/list', getAllServices);
router.get('/', require('../controller/services/getServices.js'));

module.exports = router;

