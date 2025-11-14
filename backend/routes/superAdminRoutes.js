// backend/routes/superAdminRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { listAuditLogs } = require('../controllers/superAdminController');

// Auditoría: solo superadmin
router.get('/audit-logs', protect, authorize('superadmin'), listAuditLogs);

module.exports = router;
