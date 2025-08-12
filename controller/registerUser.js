// routes/auth.js

const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user.js");

const router = express.Router();

// POST /register - only for customers
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create new customer (force role to 'customer')
    const user = new User({
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      role: "customer", // 👈 Hardcoded so no one can register as therapist/admin
      name: {
        first: firstName,
        last: lastName,
      },
    });

    await user.save();

    res.status(201).json({
      message: "Customer registered successfully",
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
