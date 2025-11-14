// backend/models/auditLogModel.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // quien hace el cambio
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // a quien se aplica
    action: { type: String, required: true, enum: ['role_change'] },
    oldRole: { type: String },
    newRole: { type: String },
    ip: { type: String },
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

