const TherapistProfile = require("../../../models/TherapistProfiles"); // Adjust path
const User  = require("../../../models/userSchema"); // Adjust path
/**
 * Bulk action controller
 * Request body:
 * {
 *   "therapistIds": ["id1", "id2", "id3"],
 *   "action": "delete" | "setActive" | "setInactive"
 * }
 */
const bulkActionTherapists = async (req, res) => {
  try {
    const { therapistIds, action } = req.body;
    console.log("from bulkaction", therapistIds, action);
    if (!Array.isArray(therapistIds) || therapistIds.length === 0) {
      return res.status(400).json({ message: "therapistIds must be a non-empty array." });
    }
    if (action) {
      action.toLowerCase();
    }

    if (!["delete", "active", "inactive"].includes(action)) {
      return res.status(400).json({ message: "Invalid action." });
    }

    let result;

    switch (action) {
      case "delete":
        const userIds = await Promise.all(therapistIds.map(async (id) => {
            const profile = await TherapistProfile.findOne({ _id: id }).populate("userId", "_id");
            return profile.userId._id;
        }));
        await User.deleteMany({ _id: { $in: userIds } });
        result = await TherapistProfile.deleteMany({ _id: { $in: therapistIds } });
        return res.status(200).json({ message: `Deleted ${result.deletedCount} therapists.` });

      case "active":
        result = await TherapistProfile.updateMany(
          { _id: { $in: therapistIds } },
          { $set: { active: true } }
        );
        return res.status(200).json({ message: `Updated ${result.modifiedCount} therapists to Active.` });

      case "inactive":
        result = await TherapistProfile.updateMany(
          { _id: { $in: therapistIds } },
          { $set: { active: false } }
        );
        return res.status(200).json({ message: `Updated ${result.modifiedCount} therapists to Inactive.` });
    }
  } catch (error) {
    console.error("Bulk action error:", error);
    return res.status(500).json({ message: "Something went wrong.", error: error.message });
  }
};

module.exports =  bulkActionTherapists;
