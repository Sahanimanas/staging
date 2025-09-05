const Service = require("../../../models/ServiceSchema"); // adjust path

// Edit (update) a service by ID
const editService = async (req, res) => {
  try {
    const { id } = req.params; // service id from URL
    const updates = req.body;  // fields to update (partial or full)

    // Find and update the service
    const updatedService = await Service.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true } // return updated doc & validate against schema
    );

    if (!updatedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("Edit Service Error:", error);
    res.status(500).json({ message: "Failed to update service", error: error.message });
  }
};

module.exports = editService;
