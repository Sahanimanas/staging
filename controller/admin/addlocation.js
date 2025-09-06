// controllers/locationController.js
const Location = require("../../models/Location"); // adjust path

// Outward code regex (e.g., EC1A, SW1A, W1, N1)
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

    // Normalize and dedupe
    postalCodes = [...new Set(postalCodes.map(code => code.toUpperCase().trim()))];

    // Validate postal codes
    const invalidCodes = postalCodes.filter(code => !OUTWARD_CODE_REGEX.test(code));
    if (invalidCodes.length > 0) {
      return res.status(400).json({ error: "Invalid UK outward codes", invalidCodes });
    }

    // We assume you only want ONE document holding all postal codes
    let locationDoc = await Location.findOne();

    if (!locationDoc) {
      // Create new doc if none exists
      locationDoc = new Location({ postalcodes: postalCodes });
    } else {
      // Merge with existing codes
      const existingCodes = new Set(locationDoc.postalcodes);
      postalCodes.forEach(code => existingCodes.add(code));
      locationDoc.postalcodes = [...existingCodes];
    }

    await locationDoc.save();

    res.status(201).json({
      message: "Postal codes added successfully",
      allCodes: locationDoc.postalcodes
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

module.exports = addPostalCodes;
