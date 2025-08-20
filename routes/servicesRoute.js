const express = require('express');
const router = express.Router();

const getAllServices = require('../controller/services/massageServices.js');
const authMiddleware = require('../middlewares/authtoken.js');

router.get('/list', authMiddleware, getAllServices);


module.exports = router;
