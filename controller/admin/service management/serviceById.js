const Service = require("../../../models/ServiceSchema");

const serviceById = async (req, res) => {
  const { id } = req.params;

  try {
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = serviceById;
