function generateReviewEmail(userName, bookingId) {
  const reviewUrl = `${process.env.FRONTEND_URL}/user/reviewbooking/${bookingId}`;

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 10px; border: 1px solid #ddd;">
      <h2 style="color: #333;">Dear, ${userName}!</h2>
      <p style="color: #555; font-size: 16px;">
        Your booking has been <b>Completed</b>. We’d love to hear about your experience with your therapist.
      </p>
      <p style="color: #555; font-size: 16px;">
        Please click the button below to share your feedback:
      </p>
      <a href="${reviewUrl}"
        style="display:inline-block;background-color:#4CAF50;color:white;padding:12px 20px;margin:20px 0;text-decoration:none;border-radius:6px;font-weight:bold;">
        Leave Your Review
      </a>
      <p style="color: #888; font-size: 14px; margin-top: 20px;">
        Thank you for choosing <b>Noira</b>. Your feedback helps us improve and serve you better!

      </p>  
    <p>Best regards,<br>Team NOIRA</p>
    </div>
    `;
}

module.exports = generateReviewEmail;
