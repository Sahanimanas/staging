const User = require("../../../models/userSchema"); // adjust path if needed

const getAddress = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ allAddresses: user.allAddresses });
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getAddress;