const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ------------------ GIFTS ------------------ */
const GiftSchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recipientEmail: { type: String, required: true },
  amount: { amount: Number, currency: String },
  message: String,
  giftType: { type: String, enum: ["digital", "physical"], default: "digital" },
  fromBundleId: { type: Schema.Types.ObjectId, ref: "Ritual" },
  isRedeemed: { type: Boolean, default: false },
  redeemedBy: { type: Schema.Types.ObjectId, ref: "User" },
  redeemedAt: Date,
  expiryDate: Date
}, { timestamps: true });

module.exports = mongoose.model("Gift", GiftSchema);