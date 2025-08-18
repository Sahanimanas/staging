// routes/auth.js

const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/userSchema.js");
const sendotp = require("./generateOTP.js");
// POST /register - only for customers
const registerUser = async (req, res) => {
  try {
    console.log(req.body)
    const { email, password, name: { first: firstName, last: lastName } } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
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
    console.log(firstName)
    const otp = await sendotp(user._id, email);

     return res.status(201).json({
      message: "User registered successfully. Please verify your email with the OTP sent.",
      userId: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = registerUser;
