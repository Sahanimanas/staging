
  const User = require('../models/userSchema.js');
const tokenSchema = require('../models/tokenSchema');
  const axios = require('axios')
  const express=  require('express')    
  const router = express.Router();
const jwt = require('jsonwebtoken')
 router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Access token required" });
   
    // 1️⃣ Verify token with Google
    const googleResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`
    );

    const googleUser = googleResponse.data; // { id, email, name, picture, ... }
    
    if (!googleUser.email) {
      return res.status(400).json({ message: "Google user email not found" });
    }

    // 2️⃣ Check if user exists
    let user = await User.findOne({ email: googleUser.email });
    if(user){
 if(user.role !== 'client'){
      return res.status(401).json({message:"unauthorised user"})
    }

    }
   
    // 3️⃣ If not, create a new user
    if (!user) {
      user = new User({
        name:{
            first: googleUser.given_name,
            last: googleUser.family_name
        },
        email: googleUser.email,
        emailVerified: true,
        googleId: googleUser.id,
        role: "client", // default role
        passwordHash:"$2b$10$BNSB9VccrgX75TSVQHbMHeS7dY1UPhODKCwD7.ePt2vRsLiahk6z.",
      });
      await user.save();
    }

    // 4️⃣ Create JWT
    const jwtToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
 
    // 5️⃣ Save token in DB
    await tokenSchema.create({
      userId: user._id,
      email: user.email,
      token: jwtToken,
      type: "login",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
   console.log(user)
    res.json({
      message: "Google login successful",
      token: jwtToken,
      user,
    });
  } catch (err) {
    console.error("Google Auth Error:", err);
    const error = err.message;
    res.status(500).json({ message: `Internal Server Error ${error}` });
  }
});

module.exports = router;