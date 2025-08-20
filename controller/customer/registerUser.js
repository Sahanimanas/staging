// routes/auth.js

const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../../models/userSchema.js");
const sendotp = require("../otpHandler/generateOTP.js");
// POST /register - only for customers
const registerUser = async (req, res) => {
  try {
    
    const { email, password, name: { first: firstName, last: lastName } } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser && !existingUser.emailVerified) {

      const otp = await sendotp(existingUser._id, email, "registration" );
      return res.status(200).json({
        message: "Email already in use, please verify your account using OTP.",
      });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create new customer (force role to 'customer')
    const user = await User.create({
      name: {
        first: firstName,
        last: lastName || "",
      },
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      role: "customer", // 👈 Hardcoded so no one can register as therapist/admin
     
    });
 
    const otp = await sendotp(user._id, email);

     return res.status(201).json({
      message: " Please verify your email with the OTP sent.",
    });
  } catch (err) {
   
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = registerUser;
