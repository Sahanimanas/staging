/* ------------------ AVAILABILITIES ------------------ */

const mongoose = require("mongoose");
const {Schema} = mongoose;


const AvailabilitySchema = new Schema({
  therapistId: { type: Schema.Types.ObjectId, ref: "TherapistProfile", required: true },
  type: String, // recurring, one-off
  slotStart: Date,
  slotEnd: Date,
  weekDay: String,
  startTime: String,
  endTime: String,
  isBlocked: { type: Boolean, default: false },
  rescheduleOut: Object
}, { timestamps: true });

module.exports = mongoose.model("Availability", AvailabilitySchema);
