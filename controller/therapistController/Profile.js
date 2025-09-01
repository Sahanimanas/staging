const express = require("express");
const router = express.Router();
const TherapistProfile = require("../../models/TherapistProfiles");
const mongoose = require("mongoose");
const userSchema = require("../../models/userSchema");

/**
 * @route   PUT /api/therapist-profile
 * @desc    Update therapist profile with user name as title
 * @access  Protected
 */
const createTherapistProfile = async (req, res) => {
  try {
    const {
      therapistId,
      bio,
      specializations,
      languages,
      servicePostcodes,
      experience,
      policies
    } = req.body;

    // ✅ Validate IDs
    if (!mongoose.Types.ObjectId.isValid(therapistId)) {
      return res.status(400).json({ error: "Invalid therapistId" });
    }
     // ✅ Find therapist profile
    const therapistProfile = await TherapistProfile.findById(therapistId);
    if (!therapistProfile) {
      return res.status(404).json({ error: "Therapist profile not found" });
    }

    // ✅ Get userId from therapist profile
    const userId = therapistProfile.userId;
    if (!userId) {
      return res.status(400).json({ error: "No userId linked to this therapist" });
    }

    // ✅ Fetch user to get the name
    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found for this therapist" });
    }

    const fullName = `${user.name.first} ${user.name.last || ""}`.trim();

    

    // ✅ Update fields
    therapistProfile.title = fullName; // Use user's full name
    if (bio) therapistProfile.bio = bio;
    if (specializations) therapistProfile.specializations = specializations;
    if (languages) therapistProfile.languages = languages;
    if (servicePostcodes) therapistProfile.servicePostcodes = servicePostcodes;
    if (experience) therapistProfile.experience = experience;
    if (policies) therapistProfile.policies = policies;

    await therapistProfile.save();

    res.status(200).json({
      message: "Therapist profile updated successfully",
      profile: therapistProfile
    });

  } catch (error) {
    console.error("Error updating therapist profile:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = createTherapistProfile;
