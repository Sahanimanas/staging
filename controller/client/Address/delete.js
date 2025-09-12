const User = require('../../../models/userSchema');

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    if (!addressId) {
      return res.status(400).json({ message: "No AddressId Found" });
    }

    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "No User Found" });
    }

    const updatedUser = await User.findById(user._id);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found in DB" });
    }

    // Remove the address from array
    const initialLength = updatedUser.allAddresses.length;
    updatedUser.allAddresses = updatedUser.allAddresses.filter(
      (addr) => addr._id.toString() !== addressId
    );

    if (updatedUser.allAddresses.length === initialLength) {
      return res.status(404).json({ message: "Address not found" });
    }

    await updatedUser.save();

    return res.status(200).json({
      message: "Address deleted successfully",
      addresses: updatedUser.allAddresses, // Return updated list only
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = deleteAddress;
