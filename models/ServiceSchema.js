
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ------------------ SERVICES ------------------ */
const ServiceSchema = new Schema({
  name: { type: String, required: true },
  tier: { type: String, enum: ["normal", "premium"], default: "normal" },
  image_url: { type: String, required: false },  
  // Multiple duration + price combos
  options: [
    {
      durationMinutes: { type: Number, required: true },
      price: {
        amount: { type: Number, required: true },   // always in GBP
      }
    }
  ],

  description: String, 
  features: [String]
}, { timestamps: true });

module.exports = mongoose.model("Service", ServiceSchema);

