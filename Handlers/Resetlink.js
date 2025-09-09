const bcrypt = require("bcrypt");
const User = require('../models/userSchema');
const jwt = require('jsonwebtoken');

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ message: "Token and password required" });

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    await user.save();
   
    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

module.exports = resetPassword;
