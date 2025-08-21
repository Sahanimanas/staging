const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/userSchema");
const sendotp = require("../otpHandler/generateOTP");
const Token = require("../../models/tokenSchema.js");
const login_User = async (req, res) => {
  try {
   
    const { email, password} = req.body;

    // 1️⃣ Check if user exists
    const user = await User.findOne({ email: email.toLowerCase()});
    
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    // 3️⃣ Check account status
    if (user.role !== "client") {
      return res.status(404).json({ message: "Error login" });
    }

   // 4️⃣ Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    console.log(user);

    try{
       await User.findOneAndUpdate({ _id: user._id }, { lastSignInAt: new Date() });
       const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });   
      await Token.create({ userId: user._id, email, token, type: "jwt", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }); // 7 days expiry
       return res.status(200).json({success: true, message: "login successfull", token });
    }catch(err){
       console.error("Error creating token:", err);
       return res.status(500).json({ message: "Server error" });


    }
      } catch (error) {
    
    return res.status(500).json({ message: "Server error" });
  }
};


module.exports = login_User;