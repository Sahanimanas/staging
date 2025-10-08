const cron = require("node-cron");
const TherapistProfile = require("../../models/TherapistProfiles");
const TherapistAvailability = require("../../models/AvailabilitySchema");
const sendMail= require('../../utils/sendmail')
async function findInactiveTherapists() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // 1️⃣ Find therapists who have availability today
  const availableAvailabilities = await TherapistAvailability.find({
    date: { $gte: startOfToday, $lte: endOfToday },
    "blocks.isAvailable": true,
  }).populate({
    path: "therapistId",
    select: "-servicesInPostalCodes",
    populate: { path: "userId", select: "name email" },
  });

  const availableIds = new Set(
    availableAvailabilities
      .map((a) => a.therapistId?._id?.toString())
      .filter(Boolean)
  );

  // 2️⃣ Find all active therapists
  const allTherapists = await TherapistProfile.find({ active: true })
    .select("-servicesInPostalCodes")
    .populate("userId", "name email");

  // 3️⃣ Find inactive (not available today)
  const inactiveTherapists = allTherapists.filter(
    (t) => !availableIds.has(t._id.toString())
  );

  return inactiveTherapists;
}

async function sendInactiveTherapistsEmail(inactiveTherapists) {
  if (!inactiveTherapists.length) {
    console.log("✅ No inactive therapists today.");
    return;
  }

  // Build HTML table
  const tableRows = inactiveTherapists
    .map(
      (t, i) => `
        <tr>
          <td style="padding:6px;">${i + 1}</td>
          <td style="padding:6px;">${t.title || "Unknown"}</td>
          <td style="padding:6px;">${t.userId?.email || "N/A"}</td>
        </tr>`
    )
    .join("");

  const htmlContent = `
    <h2>Inactive Therapists for ${new Date().toLocaleDateString()}</h2>
    <p>The following therapists did not mark availability today:</p>
    <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;">
      <thead>
        <tr>
          <th>#</th>
          <th>Therapist Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;

  await sendMail(process.env.EMAIL_ADMIN, "Today's Not Available Therapists",htmlContent,'booking')
}

const InactiveTherapsitList = async() => {
// 4️⃣ Cron job — runs every day at 11:00 PM UTC (adjust as needed)
cron.schedule("0 10 * * *", async () => {
  console.log("🔍 Running inactive therapist check...");
  try {
    const inactiveTherapists = await findInactiveTherapists();
    await sendInactiveTherapistsEmail(inactiveTherapists);
  } catch (err) {
    console.error("❌ Error in inactive therapist cron job:", err);
  }
});
}

module.exports= InactiveTherapsitList

console.log("✅ Inactive therapist cron job scheduled.");
