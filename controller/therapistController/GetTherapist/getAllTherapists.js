const User = require("../../../models/userSchema.js");
const TherapistProfile = require("../../../models/TherapistProfiles.js");

/**
 * Get all therapists with optional profile data
 */
const getAllTherapists = async (req, res) => {
  try {
    // ✅ Fetch all users with role therapist
    const therapists = await User.find({ role: "therapist" })
      .select("-passwordHash") // Exclude passwordHash
      .lean();

    if (!therapists.length) {
      return res.status(404).json({ message: "No therapists found" });
    }

    // ✅ If you also want to include TherapistProfile data:
    const therapistIds = therapists.map(t => t._id);
    const profiles = await TherapistProfile.find({ userId: { $in: therapistIds } }).lean();

    // ✅ Merge user and profile data
    const result = therapists.map(user => {
      const profile = profiles.find(p => p.userId.toString() === user._id.toString());
      return {
        ...user,
        profile: profile || null
      };
    });

    return res.status(200).json({ count: result.length, therapists: result });
  } catch (error) {
    console.error("Error fetching therapists:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports =  getAllTherapists ;
