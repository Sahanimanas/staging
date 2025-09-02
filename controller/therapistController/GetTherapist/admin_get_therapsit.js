const User = require("../../../models/userSchema.js");
const TherapistProfile = require("../../../models/TherapistProfiles.js");

const getTherapists = async (req, res) => {
  try {
    const {
      name,      // string search
      service,   // serviceId
      status,    // Verified / Pending / Active / Inactive
      location,  // city or postcode
      page,
      limit 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // --- Build filters dynamically ---
    const userFilter = { role: "therapist" };
    const profileFilter = {};

    if (name) {
      userFilter.$or = [
        { name: new RegExp(name, "i") },
        { email: new RegExp(name, "i") }
      ];
    }

    if (service) {
      profileFilter.specializations = service; // ObjectId as string
    }

    if (status) {
      profileFilter.status = status;
    }

    if (location) {
      profileFilter.location = new RegExp(location, "i");
    }

    // --- Query users with pagination ---
    const users = await User.find(userFilter)
      .select("name email avatar_url")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const userIds = users.map((u) => u._id);

    // --- Query profiles ---
    const profiles = await TherapistProfile.find({
      userId: { $in: userIds },
      ...profileFilter
    })
      .populate("specializations", "name")
      .lean();

    // --- Merge user + profile ---
    const therapists = users
      .map((u) => {
        const profile = profiles.find(
          (p) => p.userId.toString() === u._id.toString()
        );
        return profile
          ? {
              user: { userId: u._id, email: u.email, avatar_url: u.avatar_url },
              profile
            }
          : null;
      })
      .filter(Boolean);

    // --- Count total for pagination ---
    const total = await TherapistProfile.countDocuments(profileFilter);

    return res.json({
      count: therapists.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      therapists
    });
  } catch (err) {
    console.error("Error fetching therapists:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = getTherapists;
