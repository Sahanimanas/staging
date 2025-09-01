const Service = require('../../models/ServiceSchema.js');

const getServices = async (req, res) => {
  try {
    const services = await Service.find();
    const data = services.map(service => ({
      name: service.name,
      description: service.description,
      minutes: service.options.map(opt => opt.durationMinutes),
    }));
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = getServices;
