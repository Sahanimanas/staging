const User = require("../../../models/userSchema");
const cloudinary = require("cloudinary").v2; // assuming you use Cloudinary for images

const editUserProfile = async (req, res) => {
  try {
    let user = req.user;
    if (!user?._id) {
      return res.status(401).json({ message: "Unauthorized or user not found" });
    }

    if (!user.save) {
      user = await User.findById(user._id || user.userId).select('-passwordHash');
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // let ALLOWED_POSTAL_CODES = await getAllowedPostalCodes();


    // ----------------- BASIC FIELDS -----------------
    if (req.body["name[first]"]) user.name.first = req.body["name[first]"];
    if (req.body["name[last]"]) user.name.last = req.body["name[last]"];
    if (req.body.email) user.email = req.body.email;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.gender) user.gender = req.body.gender;
 
   
// ----------------- PROFILE IMAGE -----------------
    if (req.files && req.files.profileImage) {
      try {
        const uploaded = await cloudinary.uploader.upload(req.files.profileImage.tempFilePath, {
          folder: "client",
        });
        user.avatar_url = uploaded.secure_url;
      } catch (uploadErr) {
        console.error("Error uploading image:", uploadErr);
        return res.status(500).json({ message: "Image upload failed", error: uploadErr.message });
      }
    }

    // ----------------- SAVE -----------------
    const updatedUser = await user.save();
    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });

  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

module.exports = editUserProfile;
