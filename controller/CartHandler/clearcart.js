const Cart = require("../../models/CartSchema");
const Booking = require("../../models/BookingSchema");

// Clear cart after checking payment status
const clearCartIfPaid = async (req, res) => {
  try {
    const clientId = req.user.id; // from auth middleware
    const { bookingId } = req.body; // booking to check

    // 1. Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 2. Ensure this booking belongs to the client
    if (booking.clientId.toString() !== clientId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 3. Check payment status
    if (booking.paymentStatus === "paid") {
      // Clear the cart
      await Cart.findOneAndUpdate(
        { clientId },
        { $set: { items: [] } },
        { new: true }
      );

      return res.status(200).json({
        message: "Cart cleared because payment is successful"
      });
    }

    // If not paid, don’t clear
    return res.status(200).json({
      message: "Payment not completed yet, cart not cleared"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
module.exports = clearCartIfPaid;