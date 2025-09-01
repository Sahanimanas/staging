<<<<<<< HEAD
const mongoose = require("mongoose");   
const { Schema } = mongoose;
/* ------------------ TOKENS ------------------ */
const TokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true }, // hashed if sensitive
  type: { 
    type: String, 
    enum: ["access", "refresh" ,"password_reset","login","email_verification"], 
    required: true 
  },
  expiresAt: { type: Date, required: true },
  usedAt: Date, // set when consumed
  createdAt: { type: Date, default: Date.now }
});

=======
const mongoose = require("mongoose");   
const { Schema } = mongoose;
/* ------------------ TOKENS ------------------ */
const TokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true }, // hashed if sensitive
  type: { 
    type: String, 
    enum: ["access", "refresh" ,"password_reset","login","email_verification"], 
    required: true 
  },
  expiresAt: { type: Date, required: true },
  usedAt: Date, // set when consumed
  createdAt: { type: Date, default: Date.now }
});

>>>>>>> noira-backend/main
module.exports = mongoose.model("Token", TokenSchema);  