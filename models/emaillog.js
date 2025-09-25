
/* ------------------ AUDIT LOGS ------------------ */
const  mongoose =require('mongoose')
const {Schema} = mongoose

const AuditLogSchema = new Schema({
  mailto: { type: Schema.Types.ObjectId, ref: "User", required: true },
  mail:String
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model("AuditLog", AuditLogSchema);

