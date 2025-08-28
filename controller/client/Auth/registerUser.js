// routes/auth.js

const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../../../models/userSchema.js");
const sendotp = require("../../otpHandler/generateOTP.js");
// POST /register - only for customers
const registerUser = async (req, res) => {
  try {
    
    const { email, password, name: { first: firstName, last: lastName } } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      if (!existingUser.emailVerified) {
         await User.findByIdAndDelete(existingUser._id);
      } 
      else {
        return res.status(200).json({
          message: "Email already in use, please login.",
        });
      }
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
      role: "client", // 👈 Hardcoded so no one can register as therapist/admin
     
    });
 
    const otp = await sendotp(user._id, email, "registration");
    if (otp !== "OTP sent successfully") {
      await User.findByIdAndDelete(user._id); // Rollback user creation
      return res.status(500).json({ message: "Failed to send OTP" });
    }
    return res.status(201).json({
      message: " Please verify your email with the OTP sent.",
    });
  } catch (err) {
   
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = registerUser;


