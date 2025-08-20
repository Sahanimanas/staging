const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/userSchema");
const sendotp = require("../otpHandler/generateOTP");

const login_User = async (req, res) => {
  try {
   
    
    const { email, password} = req.body;

    // 1️⃣ Check if user exists
    const user = await User.findOne({ email: email.toLowerCase()});
    
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    // 3️⃣ Check account status
    if (user.role !== "customer") {
      return res.status(403).json({ message: "Error login" });
    }

   // 4️⃣ Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
   
    const otpResponse = await sendotp(user._id , user.email,"login");
    if (!otpResponse) {
      return res.status(500).json({
        message: `otpResponse: ${otpResponse}`
      });
    }
    // delete after testing 
    res.status(200).json({
      message: `otpResponse: ${otpResponse}`
    });

  } catch (error) {
    
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = login_User;