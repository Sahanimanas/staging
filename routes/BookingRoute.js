
const express = require("express");
const router = express.Router();

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

router.get("/", getAllBookings);
router.get("/:id", getBookingById);
router.put("/:id", require("../controller/booking/update_booking.js"));
router.delete("/:id", require("../controller/booking/delete_booking.js"));

module.exports = router;

