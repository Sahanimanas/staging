const bcrypt = require("bcrypt");
const User = require("../../models/userSchema.js");

/**
 * Add a new therapist user
 */
const addTherapist = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      avatar_url,
      address,
      timezone
    } = req.body;

    // ✅ Validate required fields
    if (!firstName || !email || !password) {
      return res.status(400).json({ error: "First name, email, and password are required" });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // ✅ Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ Create new therapist user
    const therapistUser = new User({
      name: {
        first: firstName,
        last: lastName || ""
      },
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: "therapist",
      avatar_url,
      address,
      timezone,
      profileComplete: false // default
    });

    await therapistUser.save();

    return res.status(201).json({
      message: "Therapist account created successfully",
      user: {
        id: therapistUser._id,
        name: therapistUser.name,
        email: therapistUser.email,
        role: therapistUser.role
      }
    });
  } catch (error) {
    console.error("Error adding therapist:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = addTherapist;
