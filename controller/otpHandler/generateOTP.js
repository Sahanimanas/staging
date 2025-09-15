const { createOtp} = require("../../services/otpservice"); // wherever you save it
const sendMail = require("../../utils/sendmail");
require('dotenv').config();
const User = require('../../models/userSchema')

const sendotp = async (userID, email, purpose) => {
  if (!email) throw new Error("Email is required");

  try {
    const otp = await createOtp(userID, email, purpose); // Generate OTP
const user = await User.findById(userID)
    const html = `
     <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
  <div style="max-width: 500px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
    <div style="padding: 20px; text-align: left; font-size: 16px; color: #333;">
      <p>Dear <b>${user.name.first} ${user.name.last}</b>,</p>
      <p>
        Your OTP for booking/verification at <b>Noira Massage Therapy</b> is 
        <b style="font-size: 20px; letter-spacing: 3px; background: #f1f1f1; padding: 5px 10px; border-radius: 4px;">${otp}</b>.
      </p>
      <p>
        Please use this code to complete your process.
      </p>
      <p>
        Thank you,<br>
        <b>Team NOIRA</b>
      </p>
    </div>
  </div>
</div>

    `;

    // Send via reusable util
    await sendMail(email, `Your ${otp.purpose} OTP for NOIRA`, html, "otp");

  return "OTP sent successfully";
  } catch (err) {
 
    throw new Error("otp not sent");
  }
};

module.exports = sendotp;