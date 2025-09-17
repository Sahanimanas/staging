// middleware/cancellationValidator.js
const CANCELLATION_REASONS = [
  "Transport delays (train/tube/Uber disruptions or significant travel time issues)",
  "Health concerns (therapist is unwell or physically unable to perform the service)",
  "Safety issues (client environment not suitable/safe, or client requests inappropriate services)",
  "Client unavailable (no-show, late arrival, or unresponsive at the time of booking)",
  "Service not offered (requested treatment not part of therapist’s skill set)",
  "Out of service area (location falls beyond the agreed coverage zone)",
  "Any other valid reason (to be specified in writing when reporting the cancellation)"
];

function CancelReason(req,res){
return res.status(200).json({CANCELLATION_REASONS})
}

function cancellationValidator(req, res, next) {
  const { reason } = req.body;

  // Allow "any other valid reason" but require additional notes
  if (reason === "Any other valid reason (to be specified in writing when reporting the cancellation)") {
    if (!req.body.notes || req.body.notes.trim() === "") {
      return res.status(400).json({
        message: "Please specify details for 'Any other valid reason'."
      });
    }
    return next();
  }

  // Check if reason is in the allowed list
  if (!CANCELLATION_REASONS.includes(reason)) {
    return res.status(400).json({
      message: "Invalid cancellation reason provided.",
      allowedReasons: CANCELLATION_REASONS
    });
  }
 req.body.reason = reason;
  next();
}

module.exports = { cancellationValidator, CancelReason };
