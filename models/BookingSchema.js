const mongoose = require("mongoose");
const { Schema } = mongoose;
const Counter = require('./CounterSchema')
/* ------------------ BOOKINGS ------------------ */
const BookingSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  therapistId: { type: Schema.Types.ObjectId, ref: "TherapistProfile", required: true },
  serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  ritualPurchaseId: { type: Schema.Types.ObjectId, ref: "RitualPurchase", required: false } || { type: String },
  bookingCode: { type: String, unique: true },
  date: { type: Date, required: true }, // if from bundle
  slotStart: { type: Date, required: true },
  slotEnd:  { type: Date, required: true },
  status: { type: String, enum: ["confirmed", "cancelled", "completed","pending","declined"], default: "pending" },
  paymentIntentId: String,
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  customerEmail: String,
  price: { amount: Number},
  eliteHourSurcharge: { type: Boolean, default: false },
  notes: String,
  isReviewed: { type: Boolean, default: false },
 receipt_url: { type: String },

  review: { 
    type: {
      rating: { type: Number, min: 1, max: 5 },
      Comment: String,
    },
    default: null,
  },
}, { timestamps: true } );

  

// 🔹 Pre-save hook to generate sequential bookingCode
BookingSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "booking" }, 
      { $inc: { seq: 1 } }, 
      { new: true, upsert: true }
    );

    this.bookingCode = `BOOK-${counter.seq.toString().padStart(4, "0")}`; 
    // e.g. BOOK-0001, BOOK-0002
  }
  next();
});

module.exports = mongoose.model("Booking", BookingSchema);
