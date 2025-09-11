// controllers/admin/getUsersWithBookingStats.js
const User = require("../../../models/userSchema");
const Booking = require("../../../models/BookingSchema");

const getUsersWithBookingStats = async (req, res) => {
  try {
    // ✅ Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ Search (by name, email, phone)
    const search = req.query.search || "";
    let searchQuery = { role: "client" };

    if (search) {
      searchQuery.$or = [
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { "name.first": { $regex: search, $options: "i" } },
        { "name.last": { $regex: search, $options: "i" } }
      ];
    }

    // ✅ Last bookings limit
    const lastBookingLimit = parseInt(req.query.lastBookingLimit) || 5;

    // ✅ Total users count
    const totalUsers = await User.countDocuments(searchQuery);

    // ✅ Fetch users with pagination
    const users = await User.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    // ✅ Fetch booking stats + last bookings per user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [bookings, totalBookings] = await Promise.all([
          Booking.find({ clientId: user._id })
            .sort({ date: -1 })
            .limit(lastBookingLimit)
            .populate("therapistId", "title")
            .populate("serviceId", "name")
            .lean(),
          Booking.find({ clientId: user._id }).lean()
        ]);

        const completed = bookings.filter(b => b.status === "completed").length;
        const pending = bookings.filter(b => b.status === "pending").length;
        const cancelled = bookings.filter(b => b.status === "cancelled").length;
        const declined = bookings.filter(b => b.status === "declined").length;

        return {
          ...user,
          bookingStats: {
            total: totalBookings.length,
            completed,
            pending,
            cancelled,
            declined,
          },
          lastBookings: bookings,
        };
      })
    );

    res.status(200).json({
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      users: usersWithStats,
    });
  } catch (err) {
    console.error("Error fetching users with booking stats:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

module.exports = getUsersWithBookingStats;
