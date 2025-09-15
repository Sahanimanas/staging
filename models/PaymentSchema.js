
const mongoose = require("mongoose")
const {Schema} = mongoose
/* ------------------ PAYMENTS ------------------ */
const PaymentSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  stripeCheckoutSessionId: String,
  stripeCustomerId: String,
  provider: String,
  providerPaymentId: String,
  amount: Number,
  paymentStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  refund: String
}, { timestamps: true });



module.exports = mongoose.model("Payment", PaymentSchema);