const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ------------------ BOOKINGS ------------------ */
const BookingSchema = new Schema({
 clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  therapistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  ritualPurchaseId: { type: Schema.Types.ObjectId, ref: "RitualPurchase" },
  bookingCode: { type: String, unique: true },
  date: { type: Date, required: true }, // if from bundle
  slotStart: { type: String, required: true },
  slotEnd:  { type: String, required: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  price: { amount: Number, currency: String },
  eliteHourSurcharge: { type: Boolean, default: false },
  notes: String
}, { timestamps: true });

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
