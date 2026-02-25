// ============================================================
// Forecast Routes — CSV upload, data check, and prediction
// ============================================================

const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');
const forecastController = require('../controllers/forecast.controller');

// All forecast routes require authentication
router.use(authMiddleware);

// POST /api/forecast/upload-csv  — upload platform CSV, store in DB
router.post('/upload-csv', uploadSingle('file'), forecastController.uploadCsv);

// POST /api/forecast/seed        — auto-load sample CSV from server (demo)
router.post('/seed', forecastController.seedCsv);

// GET  /api/forecast/has-data    — check if user already has forecast data
router.get('/has-data', forecastController.hasData);

// GET  /api/forecast/earnings-trend — daily earnings for the graph
router.get('/earnings-trend', forecastController.earningsTrend);

// POST /api/forecast/predict     — run ML prediction on stored data
router.post('/predict', forecastController.predict);

module.exports = router;
