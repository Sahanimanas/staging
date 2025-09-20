const mongoose = require("mongoose");
const { Schema } = mongoose;

const TherapistProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    title: String,
    bio: String,
    specializations: [
      {
        type: Schema.Types.ObjectId,
        ref: "Service",
        required: false,
      },
    ],
    languages: [String],

    // ✅ Array of postcodes instead of locationType
    servicesInPostalCodes: [
      {
        type: String,
        },
    ],
    experience: {
      type: Number,
      required: false,
    },

    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    policies: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("TherapistProfile", TherapistProfileSchema);
