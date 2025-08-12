const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      unique: true,
    },
    emailVerified: { type: Boolean, default: false },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ["customer", "therapist", "admin"],
      required: true,
    },
    name: { first: String, last: String },
    avatarUrl: String,
    locale: String,
    timezone: String,
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    mfaEnabled: { type: Boolean, default: false },
    profileComplete: { type: Boolean, default: false },
    lastLoginAt: Date,
    deletedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
