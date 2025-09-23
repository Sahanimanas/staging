// routes/therapist.js

const TherapistProfile = require("../../models/TherapistProfiles");


// GET /therapist/:therapistId/services
const therapistServices = async (req, res) => {
  try {
    const { therapistId } = req.params;

    // Find therapist and populate services
    const therapist = await TherapistProfile.findById(therapistId)
      .populate("specializations", "name description options")
       // select only necessary fields
      .select("specializations"); // we only need the specializations field

    if (!therapist) {
      return res.status(404).json({ error: "Therapist not found" });
    }

    res.json({
      therapistId,
      services: therapist.specializations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = therapistServices

