const User = require("../../../models/userSchema.js");

// GET /profile - get user profile
const getadminProfile = async (req, res) => {
  try {
   if(!req.user) return res.status(400).json({message:"unauthorised"})
   

    // Fetch user profile from database
    const adminProfiles = await User.find({ role:'admin'});
     

    if (!adminProfiles) {
      return res.status(404).json({ message: "Admins not found." });
    }

    res.status(200).json({ adminProfiles });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = getadminProfile;