const Service = require("../../../models/ServiceSchema");

// Delete Service
const deleteService = async (req, res) => {
  try {
    const serviceId = req.params.id;

    // Find and delete the service
    const deletedService = await Service.findByIdAndDelete(serviceId);
    if (!deletedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Server error" });
  }
}
module.exports = deleteService;