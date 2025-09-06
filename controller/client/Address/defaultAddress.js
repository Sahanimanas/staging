const User = require("../../../models/userSchema");

const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({ message: "Address ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const address = user.allAddresses.filter(addr => addr.id === addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found." });
    }

    user.address = address[0];
    await user.save();

    res.status(200).json({
      message: "Default address set successfully.",
      address: user.address,
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = setDefaultAddress;
