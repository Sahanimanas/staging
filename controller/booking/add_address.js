const User = require("../../models/userSchema");
const Location = require("../../models/Location");
const mongoose = require("mongoose");

// UK Postal Code Regex (strict but flexible)
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

const updateUserAddress = async (req, res) => {
  try {
    const userId = req.params.userId;
    const {
      address
    } = req.body;

    if (!address) {
      return res.status(400).json({ message: "Required address fields are missing." });
    }

    // Normalize postal code
    const normalizePostcode = (code) => {
      const cleaned = code.replace(/\s+/g, "").toUpperCase();
      if (cleaned.length > 3) {
        const outward = cleaned.slice(0, cleaned.length - 3);
        const inward = cleaned.slice(-3);
        return `${outward} ${inward}`;
      }
      return cleaned;
    };

    const normalizedPostalCode = normalizePostcode(address.PostalCode);

    // 🔹 Step 1: Regex validation
    if (!UK_POSTCODE_REGEX.test(normalizedPostalCode)) {
      return res.status(400).json({
        message: `${normalizedPostalCode} is not a valid UK postal code format.`,
      });
    }

    // 🔹 Step 2: Check against serviceable areas
    const outwardCode = normalizedPostalCode.split(" ")[0]; // e.g., EC1A
    const locationExists = await Location.findOne({});
    
 
    if (!locationExists.postalcodes.includes(outwardCode)) {
      return res.status(400).json({
        message: `Services are not offered in postal code area: ${normalizedPostalCode}`,
      });
    }


    // Construct new address
    const updatedAddress = {
      Building_No: address.Building_No,
      Street: address.Street,
      Locality: address.Locality || "",
      PostTown: address.PostTown || london,
      PostalCode: normalizedPostalCode,
    };

    // Update user's primary address
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { address: updatedAddress } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Push into allAddresses history
    await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $push: { allAddresses: updatedAddress } }
    );

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
