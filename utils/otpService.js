


// const axios = require("axios").default;
require("dotenv").config();
const User = require('../models/userSchema')
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;

// /**
//  * Send OTP using MSG91 API
//  */
// async function sendOtp(mobile, otpExpiry = 5, params = {}) {
//   try {
//     const options = {
//       method: "POST",
//       url: "https://control.msg91.com/api/v5/otp",
//       params: {
//   authkey: MSG91_AUTH_KEY,
//   otp_expiry: otpExpiry,
//   mobile: mobile,
//   template_id: process.env.MSG91_TEMPLATE_ID,
//   realTimeResponse: 1,
// },

//       headers: { "Content-Type": "application/json" },
//       data: JSON.stringify(params), // optional params for your template
//     };

//     const { data } = await axios.request(options);
//     return data;
//   } catch (error) {
//         return res.status(500).json({message:"fail"})
      
//   }
// }

// /**
//  * Verify OTP using MSG91 API
//  */
// async function verifyOtp(mobile, otp , userId) {
//   try {

//     const options = {
//       method: "GET",
//       url: "https://control.msg91.com/api/v5/otp/verify",
//       params: {
//         authkey: MSG91_AUTH_KEY, // ✅ pass authkey in params
//         mobile: mobile,          // ✅ include country code (e.g., 91XXXXXXXXXX)
//         otp: otp,
//       },
//       headers: { "Content-Type": "application/json" },
//     };

//     const { data } = await axios.request(options);
// 9
//    if(data.type === 'success'){
//     const user = await User.findByIdAndUpdate(
//   userId, // directly pass the ID
//   { phoneVerified: true },
//   { new: true } // return the updated document
// );

//    data.user = user;
//    }
//   console.log(data)
//     return data;
//   } catch (error) {
//     console.error("Error verifying OTP:", error.response?.data || error.message);
//     throw new Error(error.response?.data?.message || "Failed to verify OTP via MSG91");
//   }
// }

// /**
//  * Resend OTP using MSG91 API
//  */
// async function resendOtp(mobile, retryType = "text") {
//   try {
//     const options = {
//       method: "GET",
//       url: "https://control.msg91.com/api/v5/otp/retry",
//       params: {
//         authkey: MSG91_AUTH_KEY,
//         retrytype: retryType, // "text" or "voice"
//         mobile: mobile,
//       },
//     };

//     const { data } = await axios.request(options);
//     return data;
//   } catch (error) {
//     throw new Error(
//       error.response?.data?.message || "Failed to resend OTP via MSG91"
//     );
//   }
// }

// module.exports = { sendOtp, verifyOtp, resendOtp };


const axios = require('axios');
 // Assuming your OTP model is in ../models/otpModel.js
const OTP = require("../models/OtpSchema");

function generateOTP() {

  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtp(mobile, userId, purpose) {
  try {

    const otpCode = generateOTP();


    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); 

 
    await OTP.create({
      userId: userId, 
      otpCode: otpCode,
      purpose: purpose,
      expiresAt: expiresAt,
    });

    // Use MSG91 to send the custom OTP code
    const options = {
      method: "POST",
      url: "https://control.msg91.com/api/v5/otp",
      params: {
        authkey: process.env.MSG91_AUTH_KEY,
        mobile: mobile,
        otp: otpCode, // Send the custom OTP
        otp_expiry: 3,
        template_id: process.env.MSG91_TEMPLATE_ID,
        realTimeResponse: 1,
      },
      headers: { "Content-Type": "application/json" },
      data: {}, 
    };

    const { data } = await axios.request(options);
    return data;
  } catch (error) {
    console.error("Error in sendOtp:", error.message);
    return { type: "error", message: "Failed to send OTP" };
  }
}

async function verifyOtp(mobile, otp, userId) {
  try {
    // Find the latest, unused, and unexpired OTP for the user
    const otpRecord = await OTP.findOne({
      userId: userId,
      otpCode: otp,
      used: false,
      expiresAt: { $gt: Date.now() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return { type: "error", message: "Invalid or expired OTP" };
    }

    // Mark the OTP as used to prevent reuse
    otpRecord.used = true;
    await otpRecord.save();
 const user = await User.findByIdAndUpdate(
  userId, // directly pass the ID
  { phoneVerified: true },
  { new: true } // return the updated document
);

  let data = {user};
  data.type = "success";

   
console.log(data)
    return data;
   
  } catch (error) {
    console.error("Error in verifyOtp:", error.message);
    return { type: "error", message: "Failed to verify OTP" };
  }
}

module.exports = { sendOtp, verifyOtp };