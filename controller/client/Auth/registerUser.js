const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../../../models/userSchema.js");
const sendotp = require("../../otpHandler/generateOTP.js");

// ✅ Helper function to format phone number
function formatPhoneNumber(phone) {
  // Remove spaces, dashes, etc.
  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `44${cleaned}`; // add UK country code
  } else if (cleaned.length === 12) {
    return cleaned; // already formatted with country code
  } else {
    return null; // invalid number
  }
}

const registerUser = async (req, res) => {
  try {
    const { email, password, name: { first: firstName, last: lastName }, phone } = req.body;

    if (!email || !password || !firstName || !phone) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // ✅ Format phone number
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone) {
      return res.status(400).json({ message: "Invalid UK phone number." });
    }

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (existingUser) {
      if (!existingUser.emailVerified) {
        await User.findByIdAndDelete(existingUser._id);
      } else {
        return res.status(400).json({
          message: "Email already exists, please register with a different email.",
        });
      }
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create new user
    const user = await User.create({
      name: {
        first: firstName,
        last: lastName || "",
      },
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      role: "client",
      phone: formattedPhone, // ✅ use formatted phone
    });

    const otp = await sendotp(user._id, email, "registration");
    if (otp !== "OTP sent successfully") {
      await User.findByIdAndDelete(user._id); // Rollback user creation
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    return res.status(201).json({
      message: "Please verify your email with the OTP sent.",
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = registerUser;
