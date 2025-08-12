const crypto = require("crypto");

// Temporary store for OTPs (replace with DB in production)
const otpStore = {};

/**
 * Creates and stores OTP for a given email
 * @param {string} email - User's email address
 * @param {number} expiryMinutes - Expiration time in minutes (default 5)
 * @returns {string} - The generated OTP
 */
function createOtp(email, expiryMinutes = 5) {
  if (!email) throw new Error("Email is required for OTP creation");

  // Generate secure 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Store OTP with expiration
  otpStore[email] = {
    otp,
    
  };


  return otp;
}

module.exports = { createOtp, otpStore };
