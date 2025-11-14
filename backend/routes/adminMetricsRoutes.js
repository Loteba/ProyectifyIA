// backend/routes/adminMetricsRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { overview, exportMetrics, timeseries } = require('../controllers/metricsController');

// Permitir acceso a administradores y superadministradores
router.use(protect, authorize('admin','superadmin'));

router.get('/overview', overview);
router.get('/export', exportMetrics);
router.get('/timeseries', timeseries);

module.exports = router;
