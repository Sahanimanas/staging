<<<<<<< HEAD
const mongoose = require("mongoose")
const { Schema } = mongoose;

/* ------------------ REVIEWS ------------------ */
const ReviewSchema = new Schema({
  therapistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  rating: { type: Number, required: true },
  title: String,
  body: String
}, { timestamps: true });

module.exports = mongoose.model("Review", ReviewSchema);
=======
const mongoose = require("mongoose")
const { Schema } = mongoose;

/* ------------------ REVIEWS ------------------ */
const ReviewSchema = new Schema({
  therapistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  rating: { type: Number, required: true },
  title: String,
  body: String
}, { timestamps: true });

module.exports = mongoose.model("Review", ReviewSchema);
>>>>>>> noira-backend/main
    