const User = require("../../../models/userSchema.js");

// GET /profile - get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user profile from database
    let user = await User.findById(userId).select("-passwordHash");
   
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Sanitize phone number (if it exists)
    if (user.phone) {
      const digitsOnly = user.phone.replace(/\D/g, ""); // remove non-numeric chars
      if (digitsOnly.length === 12) {
        user.phone = digitsOnly.slice(-10); // keep last 10 digits
      }
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = getProfile;
