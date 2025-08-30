const jwt = require("jsonwebtoken");
const Token = require("../models/tokenSchema");
const User = require("../models/userSchema"); // Assuming you have a User model

const tokenHandler = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const email = req.headers["x-user-email"];
   
    if (!authHeader || !email) {
      return res.status(401).json({ message: "Authorization header or email missing" });
    }

    // Expecting format: "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // 1. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Match user by email
    const user = await User.findOne({ email });


    
    if (!user || user._id.toString() !== decoded.userId) {
      return res.status(403).json({ message: "Token does not match user" });
    }

    // 3. Check in Token collection
    const tokenDoc = await Token.findOne({ token, userId: user._id });
    if (!tokenDoc) {
      return res.status(403).json({ message: "Token not recognized" });
    }

    // 4. Expiry check
    if (tokenDoc.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token expired" });
    }

    // ✅ If all good
    return res.status(200).json({
      message: "valid",
    });

  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(403).json({ message: "Invalid" });
  }
};

module.exports = tokenHandler;
