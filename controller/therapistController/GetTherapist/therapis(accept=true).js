const User = require("../../../models/userSchema.js");
const TherapistProfile = require("../../../models/TherapistProfiles.js");
const Booking = require("../../../models/BookingSchema.js"); // we need Booking to count

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

    // ✅ Fetch users who are therapists & accepting
    const users = await User.find({ _id: { $in: acceptingUserIds }, role: "therapist" })
      .select("-passwordHash")
      .lean();

    const usersIds = users.map((t) => t._id);

    // ✅ Fetch therapist profiles for these users
    const profiles = await TherapistProfile.find({
      userId: { $in: usersIds },
      active: true,
    })
      .populate("specializations", "name -_id")
      .populate("userId", "avatar_url")
      .lean();

    // ✅ Count bookings per therapist
    const bookingsCount = await Booking.aggregate([
      { $match: { therapistId: { $in: usersIds }, status: "completed" } },
      { $group: { _id: "$therapistId", count: { $sum: 1 } } },
    ]);

    // Convert to map for fast lookup
    const bookingMap = {};
    bookingsCount.forEach((b) => {
      bookingMap[b._id.toString()] = b.count;
    });

    // ✅ Merge user + profile + bookingCount
    const result = users.map((user) => {
      const profile = profiles.find(
        (p) => p.userId?._id?.toString() === user._id.toString()
      );
      const bookingCount = bookingMap[user._id.toString()] || 0;

      return {
        ...user,
        bookingCount, // add booking count for sorting
        profile: profile
          ? {
              _id: profile._id,
              ...profile,
              specializations: profile.specializations?.map((s) => s.name) || [],
            }
          : null,
      };
    });

    // ✅ Sort by bookingCount descending
    result.sort((a, b) => b.bookingCount - a.bookingCount);

    // ✅ Apply pagination after sorting
    const paginatedResult = result.slice(skip, skip + limit);

    return res.status(200).json({
      count: paginatedResult.length, // count on this page
      total: totalTherapists, // total across all pages
      page,
      totalPages: Math.ceil(totalTherapists / limit),
      therapists: paginatedResult,
    });
  } catch (error) {
    console.error("Error fetching therapists:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = getAllTherapists;
