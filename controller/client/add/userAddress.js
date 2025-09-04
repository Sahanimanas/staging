const User = require("../../../models/userSchema"); // adjust path if needed
const mongoose = require("mongoose");

// Controller to update user address
const updateUserAddress = async (req, res) => {
  try {
    const userId = req.params.userId; // assume userId is passed as URL param
    const {
      buildingNo,
      street,
      locality,
      postTown,
      postalCode,
    } = req.body;

    // Validate required fields
    if (!buildingNo || !street || !postTown || !postalCode) {
      return res.status(400).json({ message: "Required address fields are missing." });
    }

    // Normalize postal code (optional, UK format)
    const normalizePostcode = (code) => {
      const cleaned = code.replace(/\s+/g, "").toUpperCase();
      if (cleaned.length > 3) {
        const outward = cleaned.slice(0, cleaned.length - 3);
        const inward = cleaned.slice(-3);
        return `${outward} ${inward}`;
      }
      return cleaned;
    };

    const updatedAddress = {
      Building_No: buildingNo,
      Street: street,
      Locality: locality || "",
      PostTown: postTown,
      PostalCode: normalizePostcode(postalCode),
    };

    // Update the user's address in DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { address: updatedAddress } },
      { new: true } // return updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Address updated successfully.",
      address: updatedUser.address,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = updateUserAddress;
