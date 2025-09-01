<<<<<<< HEAD
const mongoose = require("mongoose");
const { Schema } = mongoose;
/* ------------------ CLIENT PROFILES ------------------ */
const ClientProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  membershipTier: { type: String, enum: ["silver", "gold", "diamond", "black_label"], default: "silver" },
  loyaltyPoints: { type: Number, default: 0 },
  bookingCount: { type: Number, default: 0 } // perk calculation
}, { timestamps: true });

=======
const mongoose = require("mongoose");
const { Schema } = mongoose;
/* ------------------ CLIENT PROFILES ------------------ */
const ClientProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  membershipTier: { type: String, enum: ["silver", "gold", "diamond", "black_label"], default: "silver" },
  loyaltyPoints: { type: Number, default: 0 },
  bookingCount: { type: Number, default: 0 } // perk calculation
}, { timestamps: true });

>>>>>>> noira-backend/main
module.exports = mongoose.model("ClientProfile", ClientProfileSchema);