const User = require("../../../models/userSchema.js");

// GET /profile - get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;


    // Fetch user profile from database
    const user = await User.findById(userId).select("-password -__v");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = getProfile;