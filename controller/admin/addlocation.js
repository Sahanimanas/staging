// controllers/locationController.js
const Location = require("../../models/Location"); // adjust path

// Outward code regex (e.g., EC1A, SW1A)
const OUTWARD_CODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?$/i;

const addPostalCodes = async (req, res) => {
  try {
    let { postalCodes } = req.body; // expects { postalCodes: ["EC1A","SW1A"] } or single string

    if (!postalCodes) {
      return res.status(400).json({ error: "postalCodes field is required" });
    }

    // Convert single string to array
    if (typeof postalCodes === "string") {
      postalCodes = [postalCodes];
    }

    // Normalize codes
    postalCodes = postalCodes.map(code => code.toUpperCase().trim());

    // Validate postal codes
    const invalidCodes = postalCodes.filter(code => !OUTWARD_CODE_REGEX.test(code));
    if (invalidCodes.length > 0) {
      return res.status(400).json({ error: "Invalid UK outward codes", invalidCodes });
    }

    // Find existing codes in DB
    const existingDocs = await Location.find({ postalcodes: { $in: postalCodes } });
    const existingCodes = existingDocs.map(doc => doc.postalcodes).flat();

    // Filter out already existing codes
    const newCodes = postalCodes.filter(code => !existingCodes.includes(code));

    if (newCodes.length === 0) {
      return res.status(200).json({ message: "All postal codes already exist in DB" });
    }

    // Insert new codes as separate documents
    const insertDocs = newCodes.map(code => ({ postalcodes: code }));
    const inserted = await Location.insertMany(insertDocs);

    res.status(201).json({ message: "Postal codes added successfully", added: inserted.map(d => d.postalcodes) });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = addPostalCodes;
