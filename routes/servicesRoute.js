const express = require('express');
const router = express.Router();

const getAllServices = require('../controller/services/massageServices.js');

router.get('/list', getAllServices);


module.exports = router;
