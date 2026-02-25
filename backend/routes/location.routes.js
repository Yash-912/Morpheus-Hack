// ============================================================
// Location Routes — GPS tracking endpoints
// ============================================================

const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const locationController = require('../controllers/location.controller');

// All location routes require authentication
router.use(authMiddleware);

// POST /api/location/update — save a GPS location point
router.post('/update', locationController.update);

// GET /api/location/recent/:userId — last 50 location points
router.get('/recent/:userId', locationController.recent);

module.exports = router;
