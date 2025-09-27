const TherapistProfile = require("../../../models/TherapistProfiles");

/**
 * GET /therapists
 * Returns list of therapist ids + names (title).
 * Supports search (?q=) and limit (?limit=)
 */
const getAllnames = async (req, res) => {
  try {
    let { q = "", limit = 50 } = req.query;

    // sanitize and cap limit
    limit = Math.min(parseInt(limit, 10) || 50, 100);

    // build query (search on title)
    const query = q
      ? { title: { $regex: q, $options: "i" } } // case-insensitive match
      : {};

    // fetch therapists with filtering & limit
    const therapists = await TherapistProfile.find(query)
      .select("_id title")
      .limit(limit);

    // format response
    const result = therapists.map((t) => ({
      id: t._id,
      name: t.title || "Unknown",
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

module.exports = getAllnames;
