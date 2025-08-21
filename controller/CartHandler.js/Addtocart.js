const Cart = require("../../models/CartSchema");
const Service = require("../../models/ServiceSchema");

exports.addToCart = async (req, res) => {
  try {
    const { clientId, serviceId, therapistId, date, slotStart, slotEnd, optionIndex, notes } = req.body;

    // 1. Fetch service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // 2. Validate option index
    if (optionIndex < 0 || optionIndex >= service.options.length) {
      return res.status(400).json({ success: false, message: "Invalid service option" });
    }

    // 3. Base price from service
    let finalPrice = { ...service.options[optionIndex]._doc };
    let surcharge = false;

    // 4. Parse slotStart time
    const [hourStr, minuteStr] = slotStart.split(":");
    const hour = parseInt(hourStr, 10);

    // 5. Apply elite hour surcharge (23:00–09:00)
    if (hour >= 23 || hour < 9) {
      surcharge = true;
      finalPrice.amount += 15;
    }

    // 6. Prepare cart item
    const newItem = {
      serviceId,
      therapistId,
      date,
      slotStart,
      slotEnd,
      price: finalPrice,
      eliteHourSurcharge: surcharge,
      notes,
    };

    // 7. Save to user's cart
    let cart = await Cart.findOne({ clientId });
    if (!cart) {
      cart = await Cart.create({
        clientId,
        items: [newItem],
      });
    } else {
      cart.items.push(newItem);
      await cart.save();
    }

    return res.status(200).json({ success: true, cart });
  } catch (err) {
    console.error("Add to cart error:", err);
    return res.status(500).json({ success: false, message: "Failed to add to cart" });
  }
};
