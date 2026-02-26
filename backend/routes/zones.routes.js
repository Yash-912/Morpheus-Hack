// ============================================================
// Zone Routes — proxy to ML service for DBSCAN cluster data
// ============================================================

const router = require('express').Router();
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// GET /api/zones/current — cluster data (no auth required for map)
router.get('/current', async (req, res) => {
    try {
        const mlResponse = await axios.get(`${ML_SERVICE_URL}/zones/current`, { timeout: 15000 });
        res.json({ success: true, data: mlResponse.data });
    } catch (error) {
        res.json({ success: true, data: { clusters: [], total_clusters: 0, error: 'ML service unavailable' } });
    }
});

// GET /api/zones/health
router.get('/health', async (req, res) => {
    try {
        const mlResponse = await axios.get(`${ML_SERVICE_URL}/zones/health`, { timeout: 5000 });
        res.json({ success: true, data: mlResponse.data });
    } catch (error) {
        res.json({ success: true, data: { status: 'degraded' } });
    }
});

module.exports = router;
