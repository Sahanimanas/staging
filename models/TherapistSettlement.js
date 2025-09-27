const mongoose = require("mongoose");
const { Schema } = mongoose;

const TherapistSettlementSchema = new Schema(
  {
    // --- Identifiers and Period ---
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: "TherapistProfile",
      required: true,
    },

    // Type of settlement (Weekly, or Individual for specific cases)
    settlementType: {
      type: String,
      enum: ["WEEKLY", "INDIVIDUAL"],
      default: "WEEKLY",
    },

    // Period for weekly settlements
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    commissionRate: { type: Number, default: 0.35, required: true }, // 35% as 0.35

    // --- Aggregated Financial Data ---
    totalBookings: { type: Number, default: 0 },

    // 1. Online Revenue (Funds held by Company - Payable to Therapist)
    totalOnlineRevenue: { type: Number, default: 0 }, // Total amount paid by clients online
    companyCommissionOnline: { type: Number, default: 0 }, // 35% of totalOnlineRevenue
    payableToTherapist: { type: Number, default: 0 }, // 65% of totalOnlineRevenue ('Therapist Earnings' component)

    // 2. Cash Revenue (Funds held by Therapist - Receivable from Therapist)
    totalCashRevenue: { type: Number, default: 0 }, // Total amount paid by clients in cash
    receivableFromTherapist: { type: Number, default: 0 }, // 35% of totalCashRevenue ('Total Cash (Receivable)' component)

    // 3. Final Reconciliation
    // Final Amount = PayableToTherapist - ReceivableFromTherapist
    netSettlementAmount: { type: Number, required: true },

    actionRequired: {
      type: String,
      enum: ["PAY_THERAPIST", "COLLECT_FROM_THERAPIST", "NET_ZERO"],
      required: true,
    },

    // --- Status and Completion Tracking ---
    status: {
      type: String,
      enum: ["PENDING", "SETTLED", "ADJUSTED_NEXT_WEEK"],
      default: "PENDING",
    },

    settlementDate: { type: Date },
    settlementRef: { type: String }, // Transaction ID

    includedBookingIds: [{ type: Schema.Types.ObjectId, ref: "Booking" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TherapistSettlement",
  TherapistSettlementSchema
);
