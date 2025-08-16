const mongoose= require('mongoose')
const { Schema } = mongoose;


/* ------------------ SERVICES ------------------ */
const ServiceSchema = new Schema({
  name: String,
  tier: { type: String, enum: ["normal", "premium"] },
  durationMinutes: Number,
  price: { amount: Number, currency: String },
  description: String,
  features: [String]
}, { timestamps: true });

module.exports = mongoose.model("Service", ServiceSchema);
