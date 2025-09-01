const TherapistProfile = require("../../../models/TherapistProfiles.js");
const TherapistAvailability = require("../../../models/AvailabilitySchema.js");

/**
 * Get therapist details with availability
 */
const getTherapistById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Fetch therapist details (populate user info if needed)
    const therapist = await TherapistProfile.findById(id).populate("userId", "name email avatar_url");

    if (!therapist) {
      return res.status(404).json({ error: "Therapist not found" });
    }

    // ✅ Fetch therapist availability
    const availability = await TherapistAvailability.find({ therapistId: therapist._id });


    return res.status(200).json({
      therapist
    });
  } catch (error) {
    console.error("Error fetching therapist by ID:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = getTherapistById;
