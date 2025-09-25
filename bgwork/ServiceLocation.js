const TherapistProfile = require("../models/TherapistProfiles");
const Location = require("../models/Location");
const cron = require("node-cron");

// ✅ Controller to sync therapist postcodes to Location schema
const syncTherapistPostcodes = async () => {
  try {
    console.log("🔄 Syncing Therapist Postcodes...");

    // 1️⃣ Fetch all therapist profiles
    const therapists = await TherapistProfile.find({}, "servicesInPostalCodes");

    // 2️⃣ Extract all postcodes into a flat array
    const allPostcodes = therapists.flatMap(t => t.servicesInPostalCodes || []);

    // 3️⃣ Remove duplicates + empty/null values
    const uniquePostcodes = [...new Set(allPostcodes.filter(Boolean))];

    // 4️⃣ Validate each postcode against UK outward code regex
    const validPostcodes = uniquePostcodes.filter(pc =>
      /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(pc)
    );

    if (validPostcodes.length === 0) {
      console.log("⚠ No valid postcodes found.");
      return;
    }

    // 5️⃣ Replace existing Location document with new list (only one doc)
    await Location.findOneAndUpdate(
      {},
      { postalcodes: validPostcodes },
      { upsert: true, new: true }
    );

    console.log(`✅ Synced ${validPostcodes.length} unique postcodes to Location.`);
  } catch (error) {
    console.error("❌ Error syncing therapist postcodes:", error.message);
  }
};

// ✅ Schedule job every 6 hours (adjust as needed)
cron.schedule("0 */6 * * *", () => {
  syncTherapistPostcodes();
});

// Optional: run immediately on server start
syncTherapistPostcodes();

module.exports = syncTherapistPostcodes;
