/**
 * @api {post} /booking/create Create a new booking
 * @apiName CreateBooking
 * @apiGroup Booking
 *
 * @apiDescription
 * Creates a new booking for a client with a therapist for a specific service and time slot.
 *
 * @apiBody {String} clientId           The ID of the client/user (required).
 * @apiBody {String} therapistId        The ID of the therapist (required).
 * @apiBody {String} serviceId          The ID of the service (required).
 * @apiBody {String} ritualPurchaseId   The ID of a ritual purchase (if applicable).
 * @apiBody {String} date               The date for the booking (YYYY-MM-DD, required).
 * @apiBody {String} slotStart          Start time of the slot (HH:mm, required).
 * @apiBody {String} slotEnd            End time of the slot (HH:mm, required).
 * @apiBody {String} paymentStatus      Payment status (e.g., 'pending', 'paid').
 * @apiBody {Number} price              Price for the booking.
 * @apiBody {Boolean} eliteHourSurcharge Whether elite hour surcharge applies.
 * @apiBody {String} notes              Additional notes (optional).
 *
 * @apiSuccess (success 201) {String} message   Success message.
 * @apiSuccess (success 201) {Object} booking  The created booking object.
 *
 * @apiError (Error 400)  {String} message  Missing required fields.
 * @apiError (Error 500)  {String} message  Server error.
 *
 * @apiExample {json} Request-Example:
 *     POST /booking/create
 *     {
 *       "clientId": "123",
 *       "therapistId": "789",
 *       "serviceId": "456",
 *       "ritualPurchaseId": "abc",
 *       "date": "2025-08-21",
 *       "slotStart": "08:00",
 *       "slotEnd": "09:00",
 *       "paymentStatus": "pending",
 *       "price": 100,
 *       "eliteHourSurcharge": false,
 *       "notes": "Please be on time."
 *     }
 */

const Booking = require("../../models/BookingSchema");
const Service = require("../../models/ServiceSchema");
const User = require("../../models/userSchema");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createBooking = async (req, res) => {
  try {
    const {
      email,
      therapistId,
      serviceId,
      optionIndex,
      ritualPurchaseid,
      date,
      time,
      notes,
    } = req.body;

    // 1. Validate required fields
    if (!email || !therapistId || !serviceId || !date || !time || optionIndex === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const ritualPurchaseId = ritualPurchaseid || null;

    // 2. Find client
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Parse date + time
    const slotStart = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    slotStart.setUTCHours(hours, minutes, 0, 0);

    if (isNaN(slotStart.getTime())) {
      return res.status(400).json({ error: "Invalid date or time format" });
    }

    // 4. Fetch service and option
    const serviceDoc = await Service.findById(serviceId);
    if (!serviceDoc) return res.status(404).json({ error: "Service not found" });

    const option = serviceDoc.options[optionIndex];
    if (!option) return res.status(400).json({ error: "Invalid option index" });

    const slotEnd = new Date(slotStart.getTime() + option.durationMinutes * 60000);

    // 5. Price calculation
    let finalPrice = option.price.amount;
    let surcharge = false;
    const hour = slotStart.getUTCHours();

    if (hour >= 23 || hour < 9) {
      surcharge = true;
      finalPrice += 15;
    }

    // 6. Create booking
    const booking = await Booking.create({
      clientId: user._id,
      serviceId,
      therapistId,
      ritualPurchaseId,
      date,
      slotStart,
      slotEnd,
      paymentStatus: "pending",
      price: { amount: finalPrice, currency: "gbp" },
      eliteHourSurcharge: surcharge,
      notes,
    });

    // 7. Create Stripe checkout session
    const amount = Math.round(finalPrice * 100);

    console.log(booking._id.toString());
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: serviceDoc.name,
              description: `Booking ID: ${booking._id}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
     
      success_url: `http://localhost:5173/paymentsuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/paymentfailed`,

      customer: user._id,
      metadata: {
        "value": "true",
        bookingId: "book_011",
       
      },
    });

    return res.json({ url: session.url });

  } catch (error) {
    console.error("Booking creation failed:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = createBooking;
