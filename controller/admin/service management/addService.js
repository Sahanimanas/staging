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

// Create Service
const createService = async (req, res) => {
  try {
   
    // Validate
    if (!req.body.name) {
      return res.status(400).json({ message: "Service name is required" });
    }
    let tier;
    if(req.body.tier){
       tier = req.body.tier.toLowerCase();
    }

    let features = req.body["features[]"] || [];
    if (!Array.isArray(features)) features = [features];
    features = features.filter(f => f);

    // -----------------------------
    // Normalize options like languages[]
    // Accept JSON string or object
    // -----------------------------
     
    let options = [];
if (req.body.options) {
  try {
    options = JSON.parse(req.body.options);
  } catch (err) {
    options = [];
  }
}

    // Create new service with placeholder image URL
    const newService = new Service({
      name: req.body.name,
      tier: tier || "normal",
      description: req.body.description || "",
      options,
      features,
      image_url: "null", // temporary placeholder
    });

    await newService.save();

    // Respond immediately
    res.status(201).json({
      message: "Service created successfully. Image is being uploaded.",
      service: newService,
    });

    // Perform upload in background
    if (req.files && req.files.image) {
 
      uploadToCloudinary(req.files.image)
        .then(result => {
          const imageUrl = result.secure_url;
         
          return Service.updateOne(
            { _id: newService._id },
            { $set: { image_url: imageUrl } }
          );
        })
        .then(() => {
 
        })
        .catch(err => {
          console.error(`BACKGROUND UPLOAD FAILED for service ${newService.name}:`, err);
        });
    }

  } catch (error) {
    console.error("Error during service creation:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error creating service", error: error.message });
    }
  }
};

module.exports = createService;
