const mongoose = require("mongoose");
const { Schema } = mongoose;
/* ------------------ OTPs ------------------ */
const OTPSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: false },
  email: { type: String, required: true, unique: false },
  otpCode: { type: String, required: true }, // hash in production
  purpose: { type: String,  enum: [ "password_reset", "email_verification","registration", "invite"], required: true },
  expiresAt: Date,
  attempts: { type: Number, default: 0 },
  used: { type: Boolean, default: false }
}, { timestamps: true });

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("OTP", OTPSchema);
