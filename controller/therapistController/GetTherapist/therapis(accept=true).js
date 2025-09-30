const User = require("../../../models/userSchema.js");
const TherapistProfile = require("../../../models/TherapistProfiles.js");
const Booking = require("../../../models/BookingSchema.js");

const getAllTherapists = async (req, res) => {
  try {
    // ✅ Pagination params
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;

    // ✅ Optional postal code filter
    let outwardCode = null;
    if (req.query.postalCode) {
      const normalizedPostalCode = String(req.query.postalCode).trim().toUpperCase();
      outwardCode = normalizedPostalCode.split(" ")[0]; // first part only
    }

    // ✅ Base query: only active profiles
    const profileQuery = { active: true };
    if (outwardCode) {
      profileQuery.servicesInPostalCodes = outwardCode; // 🔑 match postal outcode
    }

    // ✅ Find therapist profiles that accept new clients
    const acceptingProfiles = await TherapistProfile.find(profileQuery).lean();
    const acceptingUserIds = acceptingProfiles.map((p) => p.userId);

    // ✅ Count total therapists (filtered by outwardCode if applied)
    const totalTherapists = acceptingUserIds.length;
    if (!totalTherapists) {
      return res.status(200).json({
        count: 0,
        total: 0,
        page,
        totalPages: 0,
        therapists: [],
      });
    }

    // ✅ Fetch users who are therapists & accepting
    const users = await User.find({ _id: { $in: acceptingUserIds }, role: "therapist" })
      .select("-passwordHash")
      .lean();

    const userIds = users.map((t) => t._id);

    // ✅ Fetch therapist profiles for these users
    const profiles = await TherapistProfile.find({
      userId: { $in: userIds },
      active: true,
    })
      .populate("specializations", "name -_id")
      .populate("userId", "avatar_url")
      .lean();

    // ✅ Count completed bookings per therapist
    const bookingsCount = await Booking.aggregate([
      { $match: { therapistId: { $in: userIds }, status: "completed" } },
      { $group: { _id: "$therapistId", count: { $sum: 1 } } },
    ]);

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
        bookingCount,
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
      count: paginatedResult.length,
      total: totalTherapists,
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
