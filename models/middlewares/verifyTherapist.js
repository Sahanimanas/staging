const TherapistProfile = require('../TherapistProfiles')

const verifyTherapist = async (req, res, next) => {
  try {
   const { therapistId } = req.body; 

    const therapistProfile = await TherapistProfile.findOne({ _id: therapistId });

    if (!therapistProfile) {
      return res.status(403).json({ message: "Access denied. Therapist profile not found." });
    }

    req.therapistProfileId = therapistProfile._id.toString();
    next();
  } catch (error) {
    console.error("Error in verifyTherapist middleware:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
module.exports = verifyTherapist;