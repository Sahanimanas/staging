const User = require("../models/userSchema");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const express = require('express')
require('dotenv').config();

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Create JWT token for reset
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m" // expires in 15 minutes
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
console.log(process.env.FRONTEND_URL)
    // ✅ Send email with reset link
    const transporter = nodemailer.createTransport({
      service: "gmail", // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset</p>
             <p>Click here to reset: <a href="${resetUrl}">${resetUrl}</a></p>
             <p>This link expires in 15 minutes.</p>`
    });

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = forgotPassword;
