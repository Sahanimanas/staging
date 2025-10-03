
const express = require("express");
const router = express.Router();
const authMiddleware = require('../models/middlewares/authtoken.js')
/*
POST url/bookings/create → create

GET url/bookings → get all

GET url/bookings/:id → get one

PUT url/bookings/:id → update

DELETE url/bookings/:id → delete

*/
const {
  getAllBookings,
  getBookingById,
} = require("../controller/booking/get_booking.js");

router.get("/" , authMiddleware , getAllBookings);
router.get("/:id", authMiddleware , getBookingById);
router.delete("/:id", authMiddleware , require("../controller/booking/delete_booking.js"));

module.exports = router;

