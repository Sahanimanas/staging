
const express = require('express');
const router = express.Router();

const addToCart =  require('../controller/CartHandler/Addtocart')
router.post('/add', addToCart);

module.exports = router;