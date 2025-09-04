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
        unique: true,
      },
    ],
    languages: [String],

    // ✅ Array of postcodes instead of locationType
    servicePostcodes: [
      {
        type: String,
        validate: {
          validator: function (v) {
            // UK postcode regex (case-insensitive)
            return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(v);
          },
          message: (props) => `${props.value} is not a valid UK postcode!`,
        },
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
