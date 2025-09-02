
const jwt = require("jsonwebtoken");
const User  = require("../userSchema.js");
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Expect: Bearer <token>
    if (!token) return res.status(401).json({ error: "Access denied, no token" });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    // Check role
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Access denied, admin only" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = verifyAdmin;

