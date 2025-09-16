const express = require("express");
const { sendOtp, verifyOtp } = require("../utils/otpService.js");
const router = express.Router();

// Send custom OTP
router.post("/send-otp", async (req, res) => {
  let { mobileNumber } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ success: false, message: "Mobile number is required" });
  }

  // Ensure country code (default: India)
//   if (!mobileNumber.startsWith("91")) {
//     mobileNumber = "91" + mobileNumber;
//   }

  try {
    const result = await sendOtp(mobileNumber);
    return res.status(result.type === "success" ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


// Verify custom OTP
router.post("/verify-otp", async (req, res) => {
  const { mobileNumber, otp,userId } = req.body;
  if (!mobileNumber || !otp) {
    return res.status(400).json({ success: false, message: "Mobile number and OTP are required" });
  }

  try {
    const result = await verifyOtp( mobileNumber, otp,userId);
    return res.status(result.type === "success" ? 200 : 400).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});



module.exports = router;
