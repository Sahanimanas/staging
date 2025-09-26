const TherapistProfile = require("../../../models/TherapistProfiles.js");
const User = require("../../../models/userSchema.js");

const therapistlist = async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;
   
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;
    const  active = status;
    // --- Build filter dynamically ---
    const filter = {};

    

    if (status !== undefined) {
      filter.active = active === "true";
    }

    // --- User filter for search ---
    let userFilter = {};
    if (search) {
      userFilter = {
        $or: [
          { "name.first": { $regex: search, $options: "i" } },
          { "name.last": { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      };
    }

    // Find matching users first if search applied
    if (Object.keys(userFilter).length > 0) {
      const users = await User.find(userFilter, "_id");
      const userIds = users.map(u => u._id);
      if (userIds.length > 0) {
        filter.userId = { $in: userIds };
      } else {
        return res.status(200).json({
          count: 0,
          total: 0,
          page: pageNumber,
          totalPages: 0,
          therapists: []
        });
      }
    }

    // --- Count total ---
    const totalDocs = await TherapistProfile.countDocuments(filter);

    // --- Query therapists and populate full User data ---
    const therapists = await TherapistProfile.find(filter)
      .populate("userId", "-_id -passwordHash") // full user object
      .skip(skip)
      .limit(pageSize);
console.log(therapists)
    // --- Merge User + Profile into one object ---
  const formattedTherapists = therapists.map(profile => {
  if (!profile.userId) {
    return null; // or skip, or handle differently
  }
  const user = profile.userId;
  return {
    ...user.toObject(),
    profile: {
      ...profile.toObject()
    }
  };
}).filter(Boolean); // remove nulls


    res.status(200).json({
      count: formattedTherapists.length,
      total: totalDocs,
      page: pageNumber,
      totalPages: Math.ceil(totalDocs / pageSize),
      therapists: formattedTherapists
    });
  } catch (error) {
    console.error("Error fetching therapists:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = therapistlist;
