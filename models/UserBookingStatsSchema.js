const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ------------------ USER BOOKING STATS ------------------ */
const UserBookingStatsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  bookingCount: { type: Number, default: 0 },
  lastBookingDate: Date
}, { timestamps: true });

module.exports = mongoose.model("UserBookingStats", UserBookingStatsSchema);
