// routes/auth.js

const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../../../models/userSchema.js");
const sendotp = require("../../otpHandler/generateOTP.js");
// const validatePostalcode = require('../../../Handlers/postalcode_validate')
// POST /register - only for customers
function validateAndFormatUKPhone(phone) {
  if (!phone) return { valid: false, formatted: null };

  // Remove all spaces, dashes, brackets
  let cleaned = phone.replace(/[\s\-()]/g, "");

  // Handle common UK formats
  if (cleaned.startsWith("0044")) {
    cleaned = "+" + cleaned.slice(2); // 0044xxxx → +44xxxx
  } else if (cleaned.startsWith("07")) {
    cleaned = "+44" + cleaned.slice(1); // 07xxxxxx → +447xxxxxx
  }

  // Must start with +44
  if (!cleaned.startsWith("+44")) {
    return { valid: false, formatted: null };
  }

  // UK numbers are usually 10 digits after +44
  const ukRegex = /^\+44\d{9,10}$/;
  if (!ukRegex.test(cleaned)) {
    return { valid: false, formatted: null };
  }

  return { valid: true, formatted: cleaned };
}

const registerUser = async (req, res) => {
  try {
    
    const { email, password, name: { first: firstName, last: lastName } , phone} = req.body;

    if(!email || !password || !firstName || !phone) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate phone number
    // const { valid, formatted } = validateAndFormatUKPhone(phone);
    // if (!valid) {
    //   return res.status(400).json({ message: "Invalid UK phone number." });
    // }
  //  }

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (existingUser) {
      if (!existingUser.emailVerified) {
         await User.findByIdAndDelete(existingUser._id);
      } 
      else {
        return res.status(400).json({
          message: "Email already exists, please register with a different email.",
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
      role: "client",
      phone: phone,  //foramtted  
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
   console.log(err.message)
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = registerUser;


