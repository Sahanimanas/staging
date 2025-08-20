const crypto = require("crypto");
const OTP = require('../models/OtpSchema');
const User = require('../models/userSchema');
const mongoose = require("mongoose");



async function createOtp(userId, email) {
  if (!email) throw new Error("Email is required for OTP creation");

  // Generate secure 6-digit OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();

  // Store OTP with expiration

   const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

  const otp = await OTP.create({
    userId: userId,
    email: email,
    otpCode: otpCode,
    purpose: "email_verification",
    expiresAt: expires
  });


  return otp;
}

module.exports = { createOtp};
