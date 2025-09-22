// routes/adminTherapist.js
const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcrypt");
const User = require("../../models/userSchema");
const TherapistProfile = require("../../models/TherapistProfiles");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 100000, // Timeout for Cloudinary's API, not the client request
});

// Upload helper remains the same
const uploadToCloudinary = async (file) => {
  // The .then() syntax is used here to easily detach this from the main request flow
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

// Controller
const createTherapist = async (req, res) => {
  
  // Use a try/catch to handle initial validation and user creation errors.
  try {
    
    // Check if user exists (no changes)
    let user = await User.findOne({ email: req.body.email });
    if (user) {
        const therapist = await TherapistProfile.findOne({ userId: user._id });
        if (!therapist) {
            await User.deleteOne({ _id: user._id });
        }
    }

    // Hash password (no changes)
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    // --- KEY CHANGE STARTS HERE ---
  newAddress =  {
            Building_No: req.body["address[Building_No]"] || "",
            Street: req.body["address[Street]"] || "",
            Locality: req.body["address[Locality]"] || "",
            PostTown: req.body["address[PostTown]"] || "LONDON",
            PostalCode: req.body["address[PostalCode]"] || "",
        }
    // 1️⃣ Create new User with a TEMPORARY avatar URL
    const newUser = new User({
        name: { first: req.body.firstName, last: req.body.lastName },
        email: req.body.email,
        passwordHash: hashedPassword,
        phone: req.body.phone,
        gender: req.body.gender || "other",
        role: "therapist",
        // Use a placeholder or default URL initially
        avatar_url: "https://www.citypng.com/public/uploads/preview/white-user-member-guest-icon-png-image-701751695037005zdurfaim0y.png?v=2025073005",
        address: newAddress,
    });
    await newUser.save();

    // Process other fields (no changes)
    let specializations = req.body["services[]"] || [];
    if (!Array.isArray(specializations)) specializations = [specializations];
    specializations = specializations.filter(id => id).map(id => new ObjectId(id.trim()));


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
      
    let languages = req.body["languages[]"] || [];
    if (!Array.isArray(languages)) languages = [languages];
    languages = languages.filter(l => l);
const Username = req.body.username?req.body.username:`${req.body.firstName}`;
    // Create TherapistProfile (no changes)
    const newTherapistProfile = new TherapistProfile({
        title: `${Username}`,
        userId: newUser._id,
        bio: req.body.bio || "",
        experience: Number(req.body.experience) || 0,
        languages,
        specializations,
        servicesInPostalCodes,
        active: req.body.active === "true",
        isVerified: req.body.isVerified === "true",
    });
    await newTherapistProfile.save();

    // 2️⃣ RESPOND IMMEDIATELY!
    // Send the success response to the user so they don't have to wait for the upload.
    res.status(201).json({
        message: "Therapist creation initiated. Profile image is being uploaded.",
        user: { ...newUser.toObject(), passwordHash: undefined },
        therapistProfile: newTherapistProfile,
    });

    // 3️⃣ Perform the slow upload in the background (fire-and-forget)
    if (req.files && req.files.profileImage) {
      
        uploadToCloudinary(req.files.profileImage)
            .then(result => {
                const avatarUrl = result.secure_url;
               
                // Update the user document with the real URL
                return User.updateOne({ _id: newUser._id }, { $set: { avatar_url: avatarUrl } });
            })
            .then(() => {
                console.log(`User document updated for ${newUser.email}.`);
            })
            .catch(uploadError => {
                // If the upload fails, log the error. The user is already created,
                // so you might need a separate process to handle failed uploads.
                console.error(`BACKGROUND UPLOAD FAILED for user ${newUser.email}:`, uploadError);
            });
    }

  } catch (error) {
    // This will catch errors from the initial, fast part of the process
    console.error("Error during initial therapist creation:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error creating therapist", error: error.message });
    }
  }
};



module.exports = createTherapist;