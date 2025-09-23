
const express = require('express');
const router = express.Router();

const getAllServices = require('../controller/services/massageServices.js');

router.get('/list', getAllServices); // price
router.get('/', require('../controller/services/getServices.js')); // no price

module.exports = router;

