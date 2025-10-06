const TherapistProfile = require('../../models/TherapistProfiles');
const TherapistAvailability = require('../../models/AvailabilitySchema');
const Booking = require('../../models/BookingSchema');

const getTherapistScheduleForAdmin = async (req, res) => {
  try {
    const { date} = req.query;
    const {therapistId} = req.params

    if (!therapistId) {
      return res.status(400).json({ success: false, message: "therapistId is required" });
    }

    // ⏰ Prepare date filter
    let dateFilter = {};
    const today = new Date();
   today.toISOString();
   dateFilter.date = { $gte: today};
   
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      dateFilter.date = { $gte: start, $lte: end };
    }

    // 1️⃣ Fetch therapist profile
    const therapist = await TherapistProfile.findById(therapistId)
      .select('-serviceInPostalCodes -policies')
      .populate({
        path: 'userId',
        select: 'name email avatar_url phone'
      });

    if (!therapist) {
      return res.status(404).json({ success: false, message: "Therapist not found" });
    }

    if (!therapist.active) {
      return res.status(200).json({ success: false, message: "Therapist is inactive" });
    }

    // 2️⃣ Fetch therapist availabilities (with optional date filter)
    const availabilities = await TherapistAvailability.find({
      therapistId,
      ...dateFilter
    })
      .select('date blocks')
      .sort({ date: 1 })
      .lean();

    // 3️⃣ Fetch therapist bookings (with optional date filter)
    const bookings = await Booking.find({
      therapistId,
      ...dateFilter
    })
      .populate('clientId', 'name email')
      .select('date time mode status clientId serviceId')
      .sort({ date: 1 })
      .lean();

    // 4️⃣ Build response
    const result = {
      _id: therapist._id,
      title: therapist.title,
      avatar_url: therapist.userId?.avatar_url || null,
      name: therapist.userId?.name || null,
      email: therapist.userId?.email || null,
      phone: therapist.userId?.phone || null,
      availabilities: availabilities.map(a => ({
        date: a.date,
        blocks: a.blocks
      }))
    };

    res.status(200).json({ success: true, therapist: result });
  } catch (err) {
    console.error('Error fetching therapist schedule for admin:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = getTherapistScheduleForAdmin;
