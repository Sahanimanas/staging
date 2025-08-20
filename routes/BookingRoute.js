const express = require('express');
const router = express.Router();

/*
POST /bookings → create

GET /bookings → get all

GET /bookings/:id → get one

PUT /bookings/:id → update

DELETE /bookings/:id → delete

*/ 

router.post('/create', require('../controller/booking/createBooking'));
router.get('/', require('../controller/booking/getAllBookings'));
router.get('/:id', require('../controller/booking/getBookingById'));
router.put('/:id', require('../controller/booking/updateBooking'));
router.delete('/:id', require('../controller/booking/deleteBooking'));

module.exports = router;