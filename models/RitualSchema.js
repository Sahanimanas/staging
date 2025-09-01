<<<<<<< HEAD
/* ------------------ RITUALS ------------------ */
const mongoose = require("mongoose");
const { Schema } = mongoose;  

const RitualSchema = new Schema({
  name: { type: String, required: true },
  sessions: { type: Number, required: true },
  durationMinutes: { type: Number, required: true },
  price: { amount: Number, currency: String },
  bonus: String,
  perks: [String],
  expiryMonths: { type: Number, default: 6 },
  isPremium: { type: Boolean, default: false }
}, { timestamps: true });
=======
/* ------------------ RITUALS ------------------ */
const mongoose = require("mongoose");
const { Schema } = mongoose;  

const RitualSchema = new Schema({
  name: { type: String, required: true },
  sessions: { type: Number, required: true },
  durationMinutes: { type: Number, required: true },
  price: { amount: Number, currency: String },
  bonus: String,
  perks: [String],
  expiryMonths: { type: Number, default: 6 },
  isPremium: { type: Boolean, default: false }
}, { timestamps: true });
>>>>>>> noira-backend/main
module.exports = mongoose.model("Ritual", RitualSchema);