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
    phone: String,
    phoneVerified: { type: Boolean, default: false },
    passwordHash: String,
    role: {
      type: String,
      enum: ["customer", "therapist", "admin"],
      required: true,
    },

    avatarUrl: String,
    locale: String,
    timezone: String,
    mfaEnabled: { type: Boolean, default: false },
    profileComplete: { type: Boolean, default: false },
    lastSignInAt: Date,
  },
  { timestamps: true }
);

/* ------------------ EXPORT MODELS ------------------ */
module.exports = mongoose.model("User", UserSchema);
