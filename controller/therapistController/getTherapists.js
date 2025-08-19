// routes/therapistRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const TherapistProfiles = require("../../models/TherapistProfiles");
const AvailabilitySchema = require("../../models/AvailabilitySchema");
const ServiceSchema = require("../../models/ServiceSchema");
const BookingSchema = require("../../models/BookingSchema");

/**
 * @route POST /therapists/filter
 * @desc Get available therapists based on service, date & time
 * @body { service: { serviceId, optionIndex }, date, time }
 */
const getTherapists = async (req, res) => {
  try {
    const { service, date, time } = req.body;
    if (
      !service?.serviceId ||
      service.optionIndex === undefined ||
      !date ||
      !time
    ) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Extract and parse date (DD-MM-YYYY)
    const [day, month, year] = date.split("-");
    const selectedDate = new Date(`${year}-${month}-${day}T${time}:00`); // ISO format YYYY-MM-DDTHH:mm:ss

    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date or time format" });
    }

    // Parse input
    const service_Id = new mongoose.Types.ObjectId(service.serviceId);
    // const selectedDate = new Date(date); // "16-08-2025"
    // const [hours, minutes] = time.split(":").map(Number);

    // Fetch service to get duration
    const serviceDoc = await ServiceSchema.findById(service_Id);
    if (!serviceDoc)
      return res.status(404).json({ error: "Service not found" });

    const option = serviceDoc.options[service.optionIndex];
    if (!option) return res.status(400).json({ error: "Invalid option index" });

    const durationMinutes = option.durationMinutes;

    // Compute slot start & end times (for comparison)
    const slotStart = new Date(selectedDate);

    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

    // Step 1: Find therapists offering this service
    const therapists = await TherapistProfiles.find({
      specializations: service.serviceId,
    }).select("_id userId");

    // console.log(service.serviceId);

    if (!therapists.length) {
      return res.json({ therapists: [] });
    }

    const therapistIds = therapists.map((t) => t._id);

    // console.log(therapistIds)
    // Step 2: Check therapist availability
    const availabilities = await AvailabilitySchema.find({
      therapistId: { $in: therapistIds },
      date: {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lte: new Date(selectedDate.setHours(23, 59, 59, 999)),
      },
    });
    // console.log(availabilities)

    // Filter therapists who have a valid available block for the slot
    const availableTherapists = availabilities.filter((av) => {
      return av.blocks.some((block) => {
        if (!block.isAvailable) return false;

        // Parse block start/end
        const [bh, bm] = block.startTime.split(":").map(Number);
        const [eh, em] = block.endTime.split(":").map(Number);

        const blockStart = new Date(av.date);
        blockStart.setHours(bh, bm, 0, 0);

        const blockEnd = new Date(av.date);
        blockEnd.setHours(eh, em, 0, 0);

        return slotStart >= blockStart && slotEnd <= blockEnd;
      });
    });

    if (!availableTherapists.length) {
      return res.json({ therapists: [] });
    }

    const availableTherapistIds = availableTherapists.map(
      (av) => av.therapistId
    );

    // Step 3: Ensure no overlapping bookings
    const conflictingBookings = await BookingSchema.find({
      therapistId: { $in: availableTherapistIds },
      date: { $eq: new Date(selectedDate) },
      $or: [
        {
          slotStart: { $lt: slotEnd.toTimeString().slice(0, 5) },
          slotEnd: { $gt: slotStart.toTimeString().slice(0, 5) },
        },
      ],
    });

    const bookedTherapistIds = conflictingBookings.map((b) =>
      b.therapistId.toString()
    );

    // Final therapist list = available but not already booked
    const finalTherapists = therapists.filter(
      (t) => !bookedTherapistIds.includes(t._id.toString())
    );
    console.log(finalTherapists);

    return res.json({
      therapists: await Promise.all(
        finalTherapists.map(async (t) => {
          const profile = await TherapistProfiles.findById(t._id).populate("userId", "email avatarUrl");
          return {
            profile
          };
        })
      ),
    });
  } catch (error) {
    console.error("Error filtering therapists:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getTherapists };
