const { body } = require("express-validator");
const { createOtp, otpStore } = require("../services/otpservice"); 

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }
  console.table(otpStore);
  const storedOtp = otpStore[email];
  if (!storedOtp) {
    console.log(req.body);
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (storedOtp.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (Date.now() > storedOtp.expires) {
    return res.status(400).json({ message: "OTP has expired" });
  }

  
  delete otpStore[email];
  console.log("OTP verified successfully:", otp);
  res.status(200).json({ success: "OTP verified successfully" });
};
module.exports = verifyOtp;
