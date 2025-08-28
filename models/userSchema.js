const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ------------------ USERS ------------------ */
const UserSchema = new Schema(
  {
    name: {
      first: { type: String, required: true },
      last: String,
    },
    email: { type: String, required: true, unique: true, lowercase: true },
    emailVerified: { type: Boolean, default: false },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },
    phone: String,
    phoneVerified: { type: Boolean, default: false },
    passwordHash: String,
    role: {
      type: String,
      enum: ["client", "therapist", "admin"],
      required: true,
    },
    googleId: String,
    appleId: String,
    avatar_url: String,
    address: {
      type: {
        Building_No: { type: String, required: true },
        Street: { type: String, required: true },
        Locality: { type: String }, // optional
        PostTown: { type: String, default: "LONDON", required: true },
        Postcode: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(v);
            },
            message: (props) => `${props.value} is not a valid UK postcode!`,
          },
        },
      },
      required: false, // ✅ whole address optional
    },
    timezone: String,
    mfaEnabled: { type: Boolean, default: false },
    profileComplete: { type: Boolean, default: false },
    lastSignInAt: Date,
  },
  { timestamps: true }
);

/* ------------------ EXPORT MODELS ------------------ */
module.exports = mongoose.model("User", UserSchema);
