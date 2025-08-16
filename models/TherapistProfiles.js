/* ------------------ THERAPIST PROFILES ------------------ */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const TherapistProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  title: String,
  bio: String,
  specializations: [String],
  languages: [String],
  locationType: { type: String, enum: ["onsite", "mobile", "both"] },
  pricing: { baseRate: Number, currency: String },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  acceptingNewClients: { type: Boolean, default: true },
  policies: Object
}, { timestamps: true });

module.exports = mongoose.model("TherapistProfile", TherapistProfileSchema);
