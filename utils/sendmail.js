// utils/sendMail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Noira App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
  }
};

module.exports = sendMail;
