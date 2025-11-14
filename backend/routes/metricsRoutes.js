// backend/routes/metricsRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { userOverview, userTimeseries } = require('../controllers/metricsController');

router.use(protect);

router.get('/overview', userOverview);
router.get('/timeseries', userTimeseries);

module.exports = router;

