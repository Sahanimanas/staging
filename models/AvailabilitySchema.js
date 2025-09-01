<<<<<<< HEAD
const mongoose = require("mongoose");
const { Schema } = mongoose;

const AvailabilitySchema = new Schema({
  therapistId: { type: Schema.Types.ObjectId, ref: "TherapistProfile", required: true },
  date: { type: Date, required: true }, // e.g. 2025-08-20

  blocks: [
    {
      startTime: { type: String, required: true }, // "09:00"
      endTime: { type: String, required: true },   // "12:00"
      isAvailable: { type: Boolean, default: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("TherapistAvailability", AvailabilitySchema);
=======
const mongoose = require("mongoose");
const { Schema } = mongoose;

const AvailabilitySchema = new Schema({
  therapistId: { type: Schema.Types.ObjectId, ref: "TherapistProfile", required: true },
  date: { type: Date, required: true }, // e.g. 2025-08-20

  blocks: [
    {
      startTime: { type: String, required: true }, // "09:00"
      endTime: { type: String, required: true },   // "12:00"
      isAvailable: { type: Boolean, default: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("TherapistAvailability", AvailabilitySchema);
>>>>>>> noira-backend/main
