const axios = require("axios");
require("dotenv").config();

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;

const sendCustomSMS = async (mobile, message) => {
  try {
    if (!mobile || !message) {
      return res.status(400).json({ error: "Mobile number and message are required" });
    }

    const options = {
      method: "POST",
      url: "https://api.msg91.com/api/v2/sendsms", // ✅ Correct endpoint for custom SMS
      headers: {
        authkey: MSG91_AUTH_KEY,
        "Content-Type": "application/json"
      },
      data: JSON.stringify({
        sender: "NOIRA", // ✅ Must be a 6-char approved sender ID
        route: 4, // ✅ Transactional route
        country: 0, // 0 = International (don't auto-format)
        sms: [
          {
            message: message,
            to: [mobile] // ✅ Full number with country code e.g. 447912345678
          }
        ]
      })
    };

    const { data } = await axios.request(options);
    // console.log("✅ SMS Sent:", data);
    return data;

  } catch (error) {
    console.error("❌ SMS Send Error:", error.response?.data || error.message);
    return ({ error: "Failed to send SMS", details: error.response?.data || error.message });
  }
};

module.exports = sendCustomSMS;