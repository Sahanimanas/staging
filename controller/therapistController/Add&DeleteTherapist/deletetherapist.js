const User = require("../../../models/userSchema.js");
const TherapistProfile = require("../../../models/TherapistProfiles.js");

/**
 * Delete therapist by ID (user + profile)
 */
const deleteTherapist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Therapist ID is required" });
    }

    // ✅ Find therapist user
    const therapistUser = await TherapistProfile.findById({_id:id});
    if (!therapistUser) {
      return res.status(404).json({ error: "Therapist not found" });
    }
      await User.findByIdAndDelete(therapistUser.userId);

    // ✅ Remove therapist profile (if exists)
    await TherapistProfile.deleteOne({ userId: therapistUser.userId });

    // ✅ Remove therapist user
  

    return res.status(200).json({ message: "Therapist deleted successfully" });
  } catch (error) {
    console.error("Error deleting therapist:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports = deleteTherapist;
