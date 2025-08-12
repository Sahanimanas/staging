const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const sendotp = require("./otpsend");

exports.loginAdminOrTherapist = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1️⃣ Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("this is user:", user);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    // 3️⃣ Check account status
    // if (user.status !== "active") {
    //   return res.status(403).json({ message: "Account is not active" });
    // }

    // 4️⃣ Verify password
    // const isMatch = await bcrypt.compare(password, user.passwordHash);
    const isMatch = (password) => {
        console.log("this is password:", user.passwordHash);
        return password === user.passwordHash;
    };

    if (!isMatch(password)) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    // 5️⃣ Generate JWT Token
    // const token = jwt.sign(
    //   { userId: user._id, role: user.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "7d" } // token expiry
    // );

    const otpResponse = await sendotp(user.email);
    if (!otpResponse) {
      return res.status(500).json({
        message: `otpResponse: ${otpResponse}`
      });
    }

    res.status(200).json({
      message: `otpResponse: ${otpResponse}`
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
