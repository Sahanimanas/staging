const User = require("../../../models/userSchema.js");
const TherapistProfile = require("../../../models/TherapistProfiles.js");

const getAllTherapists = async (req, res) => {
  try {
    // ✅ Pagination params
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;

    // ✅ Find therapist profiles that accept new clients
    const acceptingProfiles = await TherapistProfile.find({ active: true }).lean();
    const acceptingUserIds = acceptingProfiles.map((p) => p.userId);

    // ✅ Count total therapists (only those accepting)
    const totalTherapists = acceptingUserIds.length;

    if (!totalTherapists) {
      return res.status(404).json({ message: "No therapists found" });
    }

    // ✅ Fetch paginated users who are therapists & accepting
    const users = await User.find({ _id: { $in: acceptingUserIds }, role: "therapist" })
      .select("-passwordHash")
      .skip(skip)
      .limit(limit)
      .lean();

    const usersIds = users.map((t) => t._id);

    // ✅ Fetch therapist profiles for these users
    const profiles = await TherapistProfile.find({
      userId: { $in: usersIds },
      active: true,
    })
      .populate("specializations", "name -_id")
      .lean();

    // ✅ Merge user + profile
    const result = users.map((user) => {
      const profile = profiles.find(
        (p) => p.userId.toString() === user._id.toString()
      );
      return {
        ...user,
        profile: profile
          ? {
              _id: profile._id,
              ...profile,
              specializations: profile.specializations?.map((s) => s.name) || [],
            }
          : null,
      };
    });

    return res.status(200).json({
      count: result.length, // count on this page
      total: totalTherapists, // total across all pages
      page,
      totalPages: Math.ceil(totalTherapists / limit),
      therapists: result,
    });
  } catch (error) {
    console.error("Error fetching therapists:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = getAllTherapists;
