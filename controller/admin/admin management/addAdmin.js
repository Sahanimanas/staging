const User = require("../../../models/userSchema");
const bcrypt = require("bcrypt");
const addadmin = async (req, res) => {
  try {
    let userid = req.user._id;
    let user = await User.findById(userid || user.userId);
    if (!user?._id) {
      return res.status(401).json({ message: "Unauthorized! Access Denied" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if(req.body.email){
        const admin = await User.findOne({email:req.body.email});
        if(admin)
           return res.status(400).json({message:"Admin already exist"})
    }
let passwordHash = await bcrypt.hash(req.body.password,10);
    let newuser = await User.create({
       name:{
        first: req.body.first,
        last:req.body.last
       } ,
       email:req.body.email,
       phone:req.body.phone,
       gender:req.body.gender,
      phoneVerified:true,
      role:"admin",
      passwordHash
    });
    // ----------------- SAVE -----------------
   const adminuser = await User.findById(newuser._id);
   
    res
      .status(201)
      .json({ message: "Profile updated successfully", user: adminuser });
  } catch (err) {
    console.error("Error updating user profile:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

module.exports = addadmin;
