const TherapistProfile = require("../../../../models/TherapistProfiles");
const Service = require("../../../../models/ServiceSchema");

/**
 * GET /api/therapists?services=...&languages=...&gender=...
 */
const getTherapists = async (req, res) => {
  try {
    const { services, languages, gender } = req.query;

    const query = { isVerified: true };

    // --- Handle Services (specializations) ---
    if (services) {
      const serviceArr = services.split(",").map((s) => s.trim());

      // Check if values look like ObjectIds (24 hex chars)
      const isObjectId = (val) => /^[0-9a-fA-F]{24}$/.test(val);

      let serviceIds = [];

      if (serviceArr.every(isObjectId)) {
        // All are IDs
        serviceIds = serviceArr;
      } else {
        // They are names → look them up
        const serviceDocs = await Service.find({ name: { $in: serviceArr } });
        serviceIds = serviceDocs.map((s) => s._id);
      }

      if (serviceIds.length > 0) {
        query.specializations = { $in: serviceIds };
      }
    }

    // --- Handle Languages ---
    if (languages) {
      const langArr = languages.split(",").map((l) => l.trim());
      query.languages = { $in: langArr };
    }

    // --- Fetch therapists ---
    let therapists = await TherapistProfile.find(query)
      .populate("userId", "name gender email")
      .populate("specializations", "name")
      .lean();

    // --- Gender filter ---
    if (gender) {
      therapists = therapists.filter(
        (t) => t.userId?.gender?.toLowerCase() === gender.toLowerCase()
      );
    }

    // --- Clean up response ---
    const result = therapists.map((t) => ({
      ...t,
      specializations: t.specializations?.map((s) => s.name) || [],
    }));

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching therapists:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = getTherapists ;
