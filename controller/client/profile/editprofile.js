const User = require("../../../models/userSchema");
const Location = require("../../../models/Location");
// Allowed outward codes
async function getAllowedPostalCodes() {
  const loc = await Location.findOne();
  return loc?.postalcodes || [];
}

function normalizePostcode(postcode) {
  if (!postcode) return "";
  const cleaned = postcode.replace(/\s+/g, "").toUpperCase();
  if (cleaned.length > 3) {
    const outward = cleaned.slice(0, cleaned.length - 3);
    const inward = cleaned.slice(-3);
    return `${outward} ${inward}`;
  }
  return cleaned;
}

// ----------------------------
// Edit user profile controller
// ----------------------------
const editUserProfile = async (req, res) => {
  try {
    // const userId = req.params.userId;
    // const user = await User.findById(userId);
    const user = req.user; // from auth middleware
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update basic fields
    if (req.body.firstName) user.name.first = req.body.firstName;
    if (req.body.lastName) user.name.last = req.body.lastName;
    if (req.body.email) user.email = req.body.email;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.gender) user.gender = req.body.gender;

    // Update primary address with validation
    if (req.body.address) {
      const newAddr = {
        Building_No: req.body.address.Building_No || "",
        Street: req.body.address.Street || "",
        Locality: req.body.address.Locality || "",
        PostTown: req.body.address.PostTown || "LONDON",
        PostalCode: normalizePostcode(req.body.address.PostalCode || ""),
      };
const ALLOWED_POSTAL_CODES = await getAllowedPostalCodes();
      if (!ALLOWED_POSTAL_CODES.includes(newAddr.PostalCode)) {
        return res.status(400).json({
          message: "Postal code not allowed",
          invalidCode: newAddr.PostalCode,
        });
      }

      user.address = newAddr;
    }

    // Update allAddresses if provided
    if (req.body.allAddresses && Array.isArray(req.body.allAddresses)) {
      const validatedAddresses = [];
      for (let addr of req.body.allAddresses) {
        const pc = normalizePostcode(addr.PostalCode || "");
        if (!ALLOWED_POSTAL_CODES.includes(pc)) {
          return res.status(400).json({
            message: "Some postal codes in allAddresses are not allowed",
            invalidCode: pc,
          });
        }
        validatedAddresses.push({
          Building_No: addr.Building_No || "",
          Street: addr.Street || "",
          Locality: addr.Locality || "",
          PostTown: addr.PostTown || "LONDON",
          PostalCode: pc,
        });
      }
      user.allAddresses = validatedAddresses;
    }

    // Save user
    await user.save();

    res.status(200).json({ message: "User profile updated successfully", user });

  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

module.exports = editUserProfile;
