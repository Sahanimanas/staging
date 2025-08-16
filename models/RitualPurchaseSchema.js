const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ------------------ RITUAL PURCHASES ------------------ */
const RitualPurchaseSchema = new Schema({
  ritualId: { type: Schema.Types.ObjectId, ref: "Ritual", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  remainingSessions: { type: Number, required: true },
  expiryDate: Date
}, { timestamps: true });

module.exports = mongoose.model("RitualPurchase", RitualPurchaseSchema);
