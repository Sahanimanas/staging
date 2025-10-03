const express = require("express");
const OTP = require("../../models/OtpSchema");
const User = require("../../models/userSchema.js");
const jwt  = require("jsonwebtoken");
const Token = require("../../models/tokenSchema.js");

/* ------------------ VERIFY EMAIL OTP ------------------ */
const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otpCode, purpose } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
 
    // 1. Find OTP record
    const record = await OTP.findOne({
      email,
      otpCode, // ⚠️ if you hash OTP before saving, use bcrypt.compare instead
      purpose,
      used: false,
      expiresAt: { $gt: new Date() } // not expired
    });
       
    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 2. Mark OTP as used
    record.used = true;
    await record.save();

    // 3. Update user emailVerified
    const user = await User.findOneAndUpdate({ _id: record.userId }, { emailVerified: true },{ new: true }  ).select("-passwordHash");
     const digitsOnly = user.phone.replace(/\D/g, "");
      if (digitsOnly.length === 12) {
        user.phone = digitsOnly.slice(-10); // keep last 10 digits
      }
    const token = jwt.sign({ userId: record.userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Save token to database
    await Token.create({ userId: record.userId, email, token, type: "login", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }); // 7 days expiry
  if(purpose === "registration") {
    // 5. Send Welcome SMS (async, non-blocking)
    return res.status(200).json({ success: true, message: "Email verified successfully!", token ,user});}


    return res.status(200).json({ success: true, message: "Email verified successfully!", token });

  } catch (error) {
   
    return res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

module.exports = verifyEmailOtp;
