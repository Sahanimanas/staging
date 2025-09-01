const mongoose = require("mongoose");
const { Schema } = mongoose;

const CartItemSchema = new Schema({
  serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  therapistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  ritualPurchaseId: { type: Schema.Types.ObjectId, ref: "RitualPurchase", required: true },
  date: { type: Date, required: true },
  slotStart: { type: String, required: true },
  slotEnd: { type: String, required: true },
  price: { amount: Number, currency: String },
  eliteHourSurcharge: { type: Boolean, default: false },
  notes: String
});

const CartSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [CartItemSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Cart", CartSchema);
