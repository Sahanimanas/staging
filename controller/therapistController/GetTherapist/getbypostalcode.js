
const User = require("../../../models/userSchema"); // User schema
const TherapistProfile = require("../../../models/TherapistProfiles"); // TherapistProfile schema

/**
 * @route   GET /api/therapists/filter
 * @/api/therapists/filter?postcode=SW1A 2AA
 * @desc    Get therapist profiles filtered by postcode
 * @access  Public
 */
const therapistBypost = async (req, res) => {
  try {
    const { PostalCode } = req.query;

    if (!PostalCode) {
      return res.status(400).json({ error: "PostalCode is required" });
    }

    // ✅ Normalize postcode input
    const normalizedPostcode = PostalCode.trim().toUpperCase();

    // ✅ Find all therapists (users with role therapist) who have the matching postcode
    const therapists = await User.find({
      role: "therapist",
      "address.PostalCode": normalizedPostcode
    }).select("_id name address");

    if (!therapists.length) {
      return res.status(404).json({ message: "No therapists found for this postcode" });
    }

    const therapistUserIds = therapists.map(t => t._id);

    // ✅ Fetch corresponding therapist profiles using userId
    const therapistProfiles = await TherapistProfile.find({
      userId: { $in: therapistUserIds }
    });

    // ✅ Merge user data with profiles
    const result = therapistProfiles.map(profile => {
      const user = therapists.find(t => t._id.toString() === profile.userId.toString());
      return {
                profile,
        address: user.address

      };
    });

    res.json({
      message: "Therapists filtered successfully",
      count: result.length,
      therapists: result
    });

  } catch (error) {
    console.error("Error filtering therapists:", error);
    res.status(500).json({ error: "Server error" });
  }
}
module.exports= therapistBypost