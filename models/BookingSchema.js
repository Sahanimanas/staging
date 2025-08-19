const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ------------------ BOOKINGS ------------------ */
const BookingSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  therapistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  ritualPurchaseId: { type: Schema.Types.ObjectId, ref: "RitualPurchase" },
  date: { type: Date, required: true }, // if from bundle
  slotStart: { type: String, required: true },
  slotEnd:  { type: String, required: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  price: { amount: Number, currency: String },
  eliteHourSurcharge: { type: Boolean, default: false },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
