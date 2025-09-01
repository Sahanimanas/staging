<<<<<<< HEAD
const express = require('express');
const router = express.Router();

const addToCart =  require('../controller/CartHandler/Addtocart')
router.post('/add', addToCart);

=======
const express = require('express');
const router = express.Router();

const addToCart =  require('../controller/CartHandler/Addtocart')
router.post('/add', addToCart);

>>>>>>> noira-backend/main
module.exports = router;