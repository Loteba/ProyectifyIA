// backend/controllers/superAdminController.js
const asyncHandler = require('express-async-handler');
const AuditLog = require('../models/auditLogModel');

// GET /api/superadmin/audit-logs?limit=100
const listAuditLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '100', 10) || 100, 500);
  const logs = await AuditLog.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name email role')
    .populate('targetUser', 'name email role')
    .lean();
  res.json(logs);
});

module.exports = { listAuditLogs };
