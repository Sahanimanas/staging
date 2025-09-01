/**
 * @api {post} /cart/add Add item to cart
 * @apiName AddToCart
 * @apiGroup Cart
 *
 * @apiDescription
 * Adds a service to the user's cart. Handles service option validation, elite hour surcharge, and stores the item in the user's cart.
 *
 * @apiBody {String} clientId           The ID of the client/user.
 * @apiBody {String} serviceId          The ID of the service to add.
 * @apiBody {String} therapistId        The ID of the therapist (optional for some services).
 * @apiBody {String} ritualPurchaseId   The ID of a ritual purchase (if applicable).
 * @apiBody {String} date               The date for the service (YYYY-MM-DD).
 * @apiBody {String} slotStart          Start time of the slot (HH:mm).
 * @apiBody {String} slotEnd            End time of the slot (HH:mm).
 * @apiBody {Number} optionIndex        Index of the selected service option.
 * @apiBody {String} notes              Additional notes (optional).
 *
 * @apiSuccess (success 200) {Boolean} success        Whether the operation was successful.

 *
 * @apiError (Error 400)  {String} message  Invalid service or option.
 * @apiError (Error 404)  {String} message  Service not found.
 * @apiError (Error 500)  {String} message  Server error or failed to add to cart.
 * 
 * @apiExample {json} Request-Example:
 *     POST /cart/add
 *     {
 *       "clientId": "123",
 *       "serviceId": "456",
 *       "therapistId": "789",
 *       "ritualPurchaseId": "abc",
 *       "date": "2025-08-21",
 *       "slotStart": "08:00",
 *       "slotEnd": "09:00",
 *       "optionIndex": 0,
 *       "notes": "Please bring towels."
 *     }
 */

const Cart = require("../../models/CartSchema");
const Service = require("../../models/ServiceSchema");

const addToCart = async (req, res) => {
  try {
    const { clientId, serviceId, therapistId, ritualPurchaseId, date, slotStart, slotEnd, optionIndex, notes } = req.body;

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
   const option = service.options[optionIndex].toObject();  

    const finalPrice = option.price.amount; 
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
      ritualPurchaseId,
      date,
      slotStart,
      slotEnd,
      price: finalPrice,
      eliteHourSurcharge: surcharge,
      notes,
    };

    // 7. Save to user's cart
    try{
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

    }catch(err){
       console.error("Error creating cart item db:", err);
       return res.status(500).json({ message: "Server error" });
    }
    

   

  } catch (err) {
    console.error("Add to cart error:", err);
    return res.status(500).json({ success: false, message: "Failed to add to cart" });
  }
};

module.exports = addToCart;
