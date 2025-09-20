
const mongoose = require("mongoose");
const { Schema } = mongoose;
const AddressSchema = new mongoose.Schema({
  Building_No: { type: String },
  Street: { type: String },
  Locality: { type: String },
  PostTown: { type: String, default: "LONDON" },
  PostalCode: {
  type: String,
  required: true
}

});
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
    phone: {type:String, default:null},
    phoneVerified: { type: Boolean, default: false },
    passwordHash: {type:String,select:false},
    role: {
      type: String,
      enum: ["client", "therapist", "admin"],
      required: true,
    },
    googleId: String,
    appleId: String,
    avatar_url: String,
    address: {
    type: AddressSchema,
    default: null, // ✅ Will be null if not provided
  },
  allAddresses: {
    type: [AddressSchema],
    default: [], // ✅ Will be empty array if not provided
  },
    mfaEnabled: { type: Boolean, default: false },
    profileComplete: { type: Boolean, default: false },
    lastSignInAt: Date,
  },
  { timestamps: true }
);

/* ------------------ EXPORT MODELS ------------------ */
module.exports = mongoose.model("User", UserSchema);

