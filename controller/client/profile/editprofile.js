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

// ✅ Utility to rebuild nested objects from flat form-data
function buildAllAddressesFromFlatBody(body) {
  const addresses = [];
  const indexSet = new Set();

  // find all unique indices from keys like allAddresses[0][Street]
  for (const key in body) {
    const match = key.match(/^allAddresses\[(\d+)\]\[/);
    if (match) indexSet.add(Number(match[1]));
  }

  for (const idx of [...indexSet].sort((a, b) => a - b)) {
    const prefix = `allAddresses[${idx}]`;
    addresses.push({
      Building_No: body[`${prefix}[Building_No]`] || "",
      Street: body[`${prefix}[Street]`] || "",
      Locality: body[`${prefix}[Locality]`] || "",
      PostTown: body[`${prefix}[PostTown]`] || "LONDON",
      PostalCode: normalizePostcode(body[`${prefix}[PostalCode]`] || ""),
      _id: body[`${prefix}[_id]`] || undefined,
    });
  }

  return addresses;
}

function buildPrimaryAddressFromFlatBody(body) {
 
  return {
    Building_No: body["address[Building_No]"] || "",
    Street: body["address[Street]"] || "",
    Locality: body["address[Locality]"] || "",
    PostTown: body["address[PostTown]"] || "LONDON",
    PostalCode: normalizePostcode(body["address[PostalCode]"] || ""),
  };
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

    let ALLOWED_POSTAL_CODES = await getAllowedPostalCodes();


    // ----------------- BASIC FIELDS -----------------
    if (req.body["name[first]"]) user.name.first = req.body["name[first]"];
    if (req.body["name[last]"]) user.name.last = req.body["name[last]"];
    if (req.body.email) user.email = req.body.email;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.gender) user.gender = req.body.gender;
 
    
    // ----------------- PRIMARY ADDRESS -----------------
    const newAddr = buildPrimaryAddressFromFlatBody(req.body) || req.body.address;
    if (newAddr) {
      const outward = newAddr.PostalCode.split(" ")[0];
      if (!ALLOWED_POSTAL_CODES.includes(outward)) {
        return res.status(400).json({ message: "Postal code not allowed", invalidCode: outward });
      }
      user.address = newAddr;
    }

    // ----------------- ALL ADDRESSES -----------------
    // let allAddresses = [];
    // if (req.body.allAddresses && Array.isArray(req.body.allAddresses)) {
    //   allAddresses = req.body.allAddresses;
    // } else {
    //   allAddresses = buildAllAddressesFromFlatBody(req.body);
    // }

    // if (allAddresses.length > 0) {
    //   const validatedAddresses = [];
    //   for (const addr of allAddresses) {
    //     const outward = addr.PostalCode.split(" ")[0];
    //     if (!ALLOWED_POSTAL_CODES.includes(outward)) {
    //       return res.status(400).json({
    //         message: "Some postal codes in allAddresses are not allowed",
    //         invalidCode: outward,
    //       });
    //     }
    //     validatedAddresses.push(addr);
    //   }
    //   user.allAddresses = validatedAddresses;
    // }
// ----------------- PROFILE IMAGE -----------------
    if (req.files && req.files.profileImage) {
      try {
        const uploaded = await cloudinary.uploader.upload(req.files.profileImage.tempFilePath, {
          folder: "client",
        });
        user.avatar_url = uploaded.secure_url;
      } catch (uploadErr) {
        console.error("Error uploading image:", uploadErr);
        return res.status(500).json({ message: "Image upload failed", error: uploadErr.message });
      }
    }

    // ----------------- SAVE -----------------
    const updatedUser = await user.save();
    res.status(200).json({ message: "User profile updated successfully", user: updatedUser });

  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

module.exports = editUserProfile;
