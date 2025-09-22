// controllers/therapistController.js
const TherapistProfile = require("../../../models/TherapistProfiles");
const User = require("../../../models/userSchema");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 100000,
});

// Upload helper
const uploadToCloudinary = async (file) => {
  return cloudinary.uploader.upload(file.tempFilePath, {
    folder: "therapists",
  });
};


// function normalizeRegion(region) {
//   if (!region) return "";
//   let normalized = region.trim().toLowerCase();

//   // Allow short names (east, west, etc.) and expand them
//   if (["east", "west", "north", "south", "central"].includes(normalized)) {
//     normalized = `${normalized} london`;
//   }

//   return normalized;
// }

// // Allowed regions (lowercase for comparison)
// const allowedRegions = [
//   "central london",
//   "east london",
//   "west london",
//   "north london",
//   "south london"
// ];

// ✅ Edit Therapist Profile
const editTherapistProfile = async (req, res) => {
  console.log(req.body)
  const check = req.user;
  if(req.user.role !== "admin") {
  return res.status(403).json({ message: "Forbidden: Admins only" });
  }

    
  try {
    const therapistId = req.params.therapistId; // TherapistProfile _id
   
    const therapistProfile = await TherapistProfile.findById(therapistId).populate("userId","-passwordHash");

    if (!therapistProfile) {
      return res.status(404).json({ message: "Therapist profile not found" });
    }

    const user = await User.findById(therapistProfile.userId);
    if (!user) {
      return res.status(404).json({ message: "Linked user not found" });
    }

    // ----------------------------
    // Update User fields if provided
    // ----------------------------
    if (req.body.firstName || req.body.lastName) {
      user.name = {
        first: req.body.firstName || user.name.first,
        last: req.body.lastName || user.name.last,
      };
    }

    if (req.body.email) user.email = req.body.email;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.gender) user.gender = req.body.gender;
  //  
    // Update address
    const newAddress = {
      Building_No: req.body["address[Building_No]"] || user.address?.Building_No || "",
      Street: req.body["address[Street]"] || user.address?.Street || "",
      Locality: req.body["address[Locality]"] || user.address?.Locality || "",
      PostTown: req.body["address[PostTown]"] || user.address?.PostTown || "LONDON",
      PostalCode: req.body["address[PostalCode]"] || user.address?.PostalCode || "",
    };
    user.address = newAddress;

    await user.save();

    // ----------------------------
    // Update TherapistProfile fields
    // ----------------------------
    if (req.body.bio) therapistProfile.bio = req.body.bio;
    if (req.body.experience) therapistProfile.experience = Number(req.body.experience);
    if (req.body.isVerified) therapistProfile.isVerified = req.body.isVerified === "true";
    if (req.body.active) therapistProfile.active = req.body.active === "true";
    if(req.body.title) therapistProfile.title = req.body.title?req.body.title:`${req.body.firstName}`;
    // Languages
    let languages = req.body["languages[]"] || [];
    if (!Array.isArray(languages)) languages = [languages];
    therapistProfile.languages = languages.filter((l) => l);
 //console.log(therapistProfile);
    // Specializations
    let specializations = req.body["services[]"] || [];
    if (!Array.isArray(specializations)) specializations = [specializations];
    therapistProfile.specializations = specializations
      .filter((id) => id)
      .map((id) => new mongoose.Types.ObjectId(id.trim()));

 // ✅ Get postal codes input (from multiple `servicesInPostalCodes[]` fields)
let postalCodesInput = req.body["servicesInPostalCodes[]"] || [];

// Ensure it's always an array
if (!Array.isArray(postalCodesInput)) {
  postalCodesInput = [postalCodesInput];
}

// Clean & normalize
const servicesInPostalCodes = postalCodesInput
  .map(pc => String(pc).trim().toUpperCase())  // Normalize to uppercase
  .filter(pc => pc.length > 0);                // Remove empty ones

// Check if at least one is provided
if (servicesInPostalCodes.length === 0) {
  return res.status(400).json({
    message: "At least one postal code must be provided",
  });
}
  
therapistProfile.servicesInPostalCodes = servicesInPostalCodes



    // Save therapist profile
    await therapistProfile.save();
 
   
    res.status(200).json({
      message: "Therapist profile updated successfully. Image update (if any) is in progress.",
      user: { ...user.toObject(), passwordHash: undefined },
      profile: therapistProfile,
    });

    // ----------------------------
    // Background upload for profile image
    // ----------------------------
    if (req.files && req.files.profileImage) {
     
      uploadToCloudinary(req.files.profileImage)
        .then((result) => {
          const avatarUrl = result.secure_url;
       
          return User.updateOne({ _id: user._id }, { $set: { avatar_url: avatarUrl } });
        })
        .then(() => {
          console.log(`User document updated with new avatar for ${user.email}.`);
        })
        .catch((err) => {
          console.error(`BACKGROUND UPLOAD FAILED for user ${user.email}:`, err);
        });
    }
  } catch (err) {
    console.error("Error updating therapist profile:", err);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Internal server error",
        error: err.message,
      });
    }
  }
};

module.exports = editTherapistProfile;
