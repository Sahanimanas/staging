const cron = require("node-cron");
const Booking = require("../models/BookingSchema");
const TherapistProfiles = require("../models/TherapistProfiles");
const User = require('../models/userSchema')
const sendMail = require("../utils/sendmail");
// Cron job: runs every 5 minutes
const remindTherapist = async (therapist, booking) => {
  const subject = "Upcoming Booking Reminder";
  const html = `
    <p>Hello ${therapist.title},</p>
    <p>You have an upcoming booking at <strong>${booking.slotStart.toISOString()}</strong>.</p>
    <p>Please be ready 1 hour in advance.</p>
    <p>Team Noira</p>
  `;

const usertherapist = await User.findById(therapist.userId);


  const result = await sendMail(usertherapist.email, subject, html, "booking");
  if (!result.success) {
    console.error("Mail error:", result.error);
  }
};

const reminderCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour

      // Find bookings starting between now and +1 hour
      const bookings = await Booking.find({
        status: "confirmed",
        slotStart: { $gte: now, $lte: oneHourLater },
      }).populate("therapistId");

      for (const booking of bookings) {
        const therapist = booking.therapistId;
        if (therapist) {
          await remindTherapist(therapist, booking);
        }
      }
    } catch (err) {
      console.error("Error in reminder cron:", err);
    }
  });
};

module.exports = reminderCron;