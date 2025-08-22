const User = require("../../models/userSchema.js");
const TherapistProfile = require("../../models/TherapistProfiles.js");

/**
 * Delete therapist by ID (user + profile)
 */
const deleteTherapist = async (req, res) => {
  try {
    const { therapistId } = req.params;

    if (!therapistId) {
      return res.status(400).json({ error: "Therapist ID is required" });
    }

    // ✅ Find therapist user
    const therapistUser = await User.findById(therapistId);
    if (!therapistUser || therapistUser.role !== "therapist") {
      return res.status(404).json({ error: "Therapist not found" });
    }

    // ✅ Remove therapist profile (if exists)
    await TherapistProfile.deleteOne({ userId: therapistId });

    // ✅ Remove therapist user
    await User.findByIdAndDelete(therapistId);

    return res.status(200).json({ message: "Therapist deleted successfully" });
  } catch (error) {
    console.error("Error deleting therapist:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports = deleteTherapist;
