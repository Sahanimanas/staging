// controllers/serviceController.js
const Service = require("../../../models/ServiceSchema");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 100000,
});

// helper for uploads
const uploadToCloudinary = async (file) => {
  return cloudinary.uploader.upload(file.tempFilePath, {
    folder: "services",
  });
};

// Edit (update) a service by ID
const editService = async (req, res) => {
  try {
    const { id } = req.params; // service id from URL
    const updates = { ...req.body }; // shallow copy to modify safely

    // Handle JSON options
    let options = [];
    if (req.body.options) {
      try {
        options = JSON.parse(req.body.options);
      } catch (err) {
        console.error("Invalid options JSON:", err.message);
        options = [];
      }
      updates.options = options;
    }

    // Handle features[] (like createService does)
    let features = req.body["features[]"] || [];
    if (!Array.isArray(features)) features = [features];
    features = features.filter((f) => f);
    updates.features = features;

    // Perform update (without image first)
    let updatedService = await Service.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Respond immediately
    res.status(200).json({
      message: "Service updated successfully. Image update (if any) is in progress.",
      service: updatedService,
    });

    // Background upload if image provided
    if (req.files && req.files.image) {
      console.log(`Starting background upload for service: ${updatedService.name}`);
      uploadToCloudinary(req.files.image)
        .then((result) => {
          const imageUrl = result.secure_url;
          console.log(`Upload successful for ${updatedService.name}. URL: ${imageUrl}`);
          return Service.updateOne(
            { _id: updatedService._id },
            { $set: { image_url: imageUrl } }
          );
        })
        .then(() => {
          console.log(
            `Service document updated with new image URL for: ${updatedService.name}`
          );
        })
        .catch((err) => {
          console.error(
            `BACKGROUND UPLOAD FAILED for service ${updatedService.name}:`,
            err
          );
        });
    }
  } catch (error) {
    console.error("Edit Service Error:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Failed to update service", error: error.message });
    }
  }
};

module.exports = editService;
