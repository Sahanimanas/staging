const { createOtp} = require("../../services/otpservice"); // wherever you save it
const sendMail = require("../../utils/sendmail");
require('dotenv').config();


const sendotp = async (userID, email, purpose) => {
  if (!email) throw new Error("Email is required");

  try {
    const otp = await createOtp(userID, email, purpose); // Generate OTP

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 500px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
          <div style="background-color: #4CAF50; padding: 15px; text-align: center; color: white;">
            <h2>Your ${otp.purpose} OTP</h2>
          </div>
          <div style="padding: 20px; text-align: center;">
            <p style="font-size: 16px; color: #333;">Use the following One-Time Password to complete your ${otp.purpose}:</p>
            <p style="font-size: 24px; font-weight: bold; background: #f1f1f1; padding: 10px; border-radius: 5px; display: inline-block; letter-spacing: 4px;">
              ${otp.otpCode}
            </p>
            <p style="font-size: 14px; color: #555;">This OTP will expire in <b>5 minutes</b>. Do not share it with anyone.</p>
          </div>
          <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #777;">
            © ${new Date().getFullYear()} Noira. All rights reserved.
          </div>
        </div>
      </div>
    `;

    // Send via reusable util
    await sendMail(email, `Your ${otp.purpose} OTP for NOIRA`, html, "otp");

  return "OTP sent successfully";
  } catch (err) {
  console.log(err.message);
    throw new Error("otp not sent");
  }
};

module.exports = sendotp;