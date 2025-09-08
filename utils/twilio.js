const twilio = require("twilio");

const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send SMS using Twilio
 * @param {string} to - Recipient phone number (+44 format)
 * @param {string} message - Message content
 */
const sendSMS = async (to, message) => {
  try {
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to, // must be in +44xxxx format
    });
    console.log("SMS sent:", response.sid);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error("Twilio SMS Error:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendSMS;
