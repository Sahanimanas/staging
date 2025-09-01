/* ------------------ AUDIT LOGS ------------------ */
const  mongoose =require('mongoose')
const {Schema} = mongoose

const AuditLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  actorRole: String,
  action: String,
  resourceType: String,
  resourceId: Schema.Types.Mixed,
  metadata: Object
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
