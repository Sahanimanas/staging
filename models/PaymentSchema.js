
const mongoose = require("mongoose")
const {Schema} = mongoose
/* ------------------ PAYMENTS ------------------ */
const PaymentSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  provider: String,
  providerPaymentId: String,
  amount: { amount: Number, currency: String },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  method: String,
  refund: Object
}, { timestamps: true });



module.exports = mongoose.model("Payment", PaymentSchema);