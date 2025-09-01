
// models/CheckoutSession.js
const mongoose = require("mongoose");

const CheckoutSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true }, // Stripe session id
    paymentIntentId: { type: String },
    customerEmail: { type: String },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // link to your booking if needed
    amountTotal: { type: Number },
    currency: { type: String },
    status: { type: String }, // open, complete, expired, paid, etc.
    rawData: { type: Object }, // store full session payload for debugging
  },
  { timestamps: true }
);

module.exports = mongoose.model("CheckoutSession", CheckoutSessionSchema);

