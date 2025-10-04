const TherapistProfile = require('../../models/TherapistProfiles');
const TherapistAvailability = require('../../models/AvailabilitySchema');

/**
 * Get therapists available and unavailable for today (full therapist + user details)
 */
const getTherapistAvailabilityToday = async (req, res) => {
  try {
    // Define today's date range
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1️⃣ Fetch therapists with available blocks today
    const availableAvailabilities = await TherapistAvailability.find({
      date: { $gte: startOfToday, $lte: endOfToday },
      "blocks.isAvailable": true
    }).populate({
  path: 'therapistId',
  select: '-servicesInPostalCodes', // ⛔ exclude this field
  populate: {
    path: 'userId',
    // optionally: select only useful user fields
    // select: 'name email avatar_url'
  }
});
   
    const availableMap = new Map();

    availableAvailabilities.forEach(avail => {
      const therapist = avail.therapistId;
      if (therapist && !availableMap.has(therapist._id.toString())) {
        // Store full therapist profile with full user populated
        availableMap.set(therapist._id.toString(), therapist);
      }
    });

    const availableTherapists = Array.from(availableMap.values());

    // 2️⃣ Fetch all active therapists (with full user info)
    const allTherapists = await TherapistProfile.find({ active: true }).select('-servicesInPostalCodes')
      .populate('userId');

    // 3️⃣ Compute unavailable therapists (those not in availableMap)
    const unavailableTherapists = allTherapists.filter(
      t => !availableMap.has(t._id.toString())
    );

    // 4️⃣ Respond with both lists
    res.status(200).json({
      success: true,
      available: availableTherapists,
      unavailable: unavailableTherapists
    });

  } catch (err) {
    console.error('Error fetching therapists availability:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = getTherapistAvailabilityToday;
