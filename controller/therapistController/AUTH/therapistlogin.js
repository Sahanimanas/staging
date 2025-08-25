const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../../models/userSchema.js");
const Token = require("../../../models/tokenSchema.js");
const TherapistProfiles = require("../../../models/TherapistProfiles.js");

const login_User = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // ✅ 1. Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // ✅ 2. Check role
    if (user.role !== "therapist") {
      return res.status(403).json({ message: "Not authorized as therapist" });
    }

    // ✅ 3. Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // ✅ 4. Update last login timestamp
    await User.findByIdAndUpdate(user._id, { lastSignInAt: new Date() });

    // ✅ 5. Get Therapist Profile
    const therapist = await TherapistProfiles.findOne({ userId: user._id });
    if (!therapist) {
      return res.status(404).json({ message: "Therapist profile not found" });
    }
    console.log(therapist);

    // ✅ 6. Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
console.log(token)
    // ✅ 7. Save token in DB (optional)
    await Token.create({
      userId: user._id,
      email,
      token,
      type: "login",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) //7 din
      
    });

    // ✅ 8. Send response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      userId: user._id,
      therapistId: therapist._id
    });

  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = login_User;
