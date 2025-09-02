const Service = require("../../models/ServiceSchema");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const addService = async (req, res) => {
  if (!req.user) {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (!req.files.image) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  try {
    const file = req.files.image;
    cloudinary.uploader.upload(
      file.tempFilePath,
      { folder: "services" },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Error uploading image" });
        }

        const {
          name,
          description,
          options: [{ price: { amount: amount }, durationMinutes: durationMinutes }],
        } = req.body;
        const newService = new Service({
          name,
          description,
          options: [{ price: { amount }, durationMinutes }],
          image_url: result.url,
        });
        await newService.save();
        res
          .status(201)
          .json({ message: "Service added successfully", service: newService });
      }
    );
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = addService;
