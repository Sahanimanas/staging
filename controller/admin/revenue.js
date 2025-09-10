const Booking = require("../../models/BookingSchema");
const Therapist = require("../../models/TherapistProfiles");
const Service = require("../../models/ServiceSchema");
const mongoose = require("mongoose");
const getRevenueAnalytics = async (req, res) => {
  try {
    const { filter, startDate, endDate, therapistId, serviceId, status, paymentStatus } = req.query;

    let matchConditions = {};

    // 🔹 Date filter logic
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let rangeStart, rangeEnd;

    switch (filter) {
      case "today":
        rangeStart = new Date(today);
        rangeEnd = new Date(today);
        rangeEnd.setUTCHours(23, 59, 59, 999);
        break;

      case "week": {
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());
        firstDayOfWeek.setUTCHours(0, 0, 0, 0);

        const lastDayOfWeek = new Date(today);
        lastDayOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        lastDayOfWeek.setUTCHours(23, 59, 59, 999);

        rangeStart = firstDayOfWeek;
        rangeEnd = lastDayOfWeek;
        break;
      }

      case "month":
        rangeStart = new Date(today.getFullYear(), today.getMonth(), 1);
        rangeEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        rangeEnd.setUTCHours(23, 59, 59, 999);
        break;

      case "year":
        rangeStart = new Date(today.getFullYear(), 0, 1);
        rangeEnd = new Date(today.getFullYear(), 11, 31);
        rangeEnd.setUTCHours(23, 59, 59, 999);
        break;

      case "custom":
        if (!startDate || !endDate) {
          return res.status(400).json({ error: "Custom filter requires startDate & endDate" });
        }
        rangeStart = new Date(startDate);
        rangeEnd = new Date(endDate);
        break;

      default:
        rangeStart = new Date(0);
        rangeEnd = new Date();
        break;
    }

    // Apply date condition
    matchConditions.date = { $gte: rangeStart, $lte: rangeEnd };

    // Apply optional filters
    if (therapistId){
        const isValidTherapistId = new mongoose.Types.ObjectId(therapistId);
        matchConditions.therapistId = isValidTherapistId;}
    if (serviceId) matchConditions.serviceId = serviceId;
    if (status) matchConditions.status = status;
    if (paymentStatus) matchConditions.paymentStatus = paymentStatus;
    else matchConditions.paymentStatus = "paid"; // default only paid

    /* ------------------ Aggregations ------------------ */
console.log(matchConditions)
    // 🔹 Overall revenue (grouped by currency)
    const overallRevenue = await Booking.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "pound",
          totalRevenue: { $sum: "$price.amount" },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    // 🔹 Breakdown by therapist
    const revenueByTherapist = await Booking.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$therapistId",
          totalRevenue: { $sum: "$price.amount" },
          totalBookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "therapistprofiles",
          localField: "_id",
          foreignField: "_id",
          as: "therapist",
        },
      },
      { $unwind: "$therapist" },
      {
        $project: {
          _id: 1,
          totalRevenue: 1,
          totalBookings: 1,
          therapistName: "$therapist.title",
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // 🔹 Breakdown by service
    const revenueByService = await Booking.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$serviceId",
          totalRevenue: { $sum: "$price.amount" },
          totalBookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: "$service" },
      {
        $project: {
          _id: 1,
          totalRevenue: 1,
          totalBookings: 1,
          serviceName: "$service.name",
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    return res.json({
      filter: filter || "all",
      range: { start: rangeStart, end: rangeEnd },
      overallRevenue,
      revenueByTherapist,
      revenueByService,
    });
  } catch (error) {
    console.error("Revenue Analytics Error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

module.exports = getRevenueAnalytics;
