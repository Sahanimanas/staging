const User = require("../../../models/userSchema");
const Location = require("../../../models/Location");
const cloudinary = require("cloudinary").v2; // assuming you use Cloudinary for images

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

const editUserProfile = async (req, res) => {
  try {
    let user = req.user;
    if (!user?._id) {
      return res.status(401).json({ message: "Unauthorized or user not found" });
    }

    if (!user.save) {
      user = await User.findById(user._id || user.userId);
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(req.body)

    let ALLOWED_POSTAL_CODES = await getAllowedPostalCodes();
    ALLOWED_POSTAL_CODES = ALLOWED_POSTAL_CODES.map(normalizePostcode);

    // ----------------- UPDATE FIELDS -----------------
    if (req.body["name[first]"]) user.name.first = req.body["name[first]"];
    if (req.body["name[last]"]) user.name.last = req.body["name[last]"];
    if (req.body.email) user.email = req.body.email;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.gender) user.gender = req.body.gender;

    // ----------------- UPDATE PROFILE IMAGE -----------------
    if (req.files && req.files.profileImage) {
      const file = req.files.profileImage;
      try {
        const uploaded = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "client",
        });
        user.avatar_url = uploaded.secure_url;
        console.log("uploaded")
      } catch (uploadErr) {
        console.error("Error uploading image:", uploadErr);
        return res.status(500).json({ message: "Image upload failed", error: uploadErr.message });
      }
    }

    // ----------------- PRIMARY ADDRESS -----------------
    if (req.body.address) {
      const newAddr = {
        Building_No: req.body.address.Building_No || "",
        Street: req.body.address.Street || "",
        Locality: req.body.address.Locality || "",
        PostTown: req.body.address.PostTown || "LONDON",
        PostalCode: normalizePostcode(req.body.address.PostalCode || ""),
      };

      const outward = newAddr.PostalCode.split(" ")[0]; // ✅ outward code check
      if (!ALLOWED_POSTAL_CODES.includes(outward)) {
        return res.status(400).json({ message: "Postal code not allowed", invalidCode: outward });
      }

      user.address = newAddr;
    }

    // ----------------- ALL ADDRESSES -----------------
    if (req.body.allAddresses && Array.isArray(req.body.allAddresses)) {
      const validatedAddresses = [];
      for (const addr of req.body.allAddresses) {
        const pc = normalizePostcode(addr.PostalCode || "");
        const outward = pc.split(" ")[0];
        if (!ALLOWED_POSTAL_CODES.includes(outward)) {
          return res.status(400).json({
            message: "Some postal codes in allAddresses are not allowed",
            invalidCode: outward,
          });
        }
        validatedAddresses.push({
          Building_No: addr.Building_No || "",
          Street: addr.Street || "",
          Locality: addr.Locality || "",
          PostTown: addr.PostTown || "LONDON",
          PostalCode: pc,
          _id: addr._id,
        });
      }
      user.allAddresses = validatedAddresses;
    }

    // ----------------- SAVE -----------------
    const updatedUser = await user.save();
    // console.log("last update",updatedUser)
    res.status(200).json({ message: "User profile updated successfully", user: updatedUser });

  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

module.exports = editUserProfile;
