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
        // Fallback: hardcoded Mumbai + Pune hot zones for hackathon demo
        const mockClusters = {
            time_block: 'lunch_rush',
            total_clusters: 11,
            clusters: [
                // Mumbai zones
                { cluster_id: 0, center_lat: 19.1136, center_lng: 72.8697, radius_km: 1.8, demand_level: 'high', est_earnings_per_hr: 320, avg_orders: 12, score: 92, city: 'Mumbai', area: 'Andheri East' },
                { cluster_id: 1, center_lat: 19.0178, center_lng: 72.8478, radius_km: 1.5, demand_level: 'high', est_earnings_per_hr: 290, avg_orders: 10, score: 87, city: 'Mumbai', area: 'Dadar' },
                { cluster_id: 2, center_lat: 19.0596, center_lng: 72.8295, radius_km: 2.0, demand_level: 'medium', est_earnings_per_hr: 240, avg_orders: 8, score: 74, city: 'Mumbai', area: 'Bandra West' },
                { cluster_id: 3, center_lat: 19.0760, center_lng: 72.8777, radius_km: 1.2, demand_level: 'medium', est_earnings_per_hr: 210, avg_orders: 7, score: 68, city: 'Mumbai', area: 'Kurla' },
                { cluster_id: 4, center_lat: 19.1286, center_lng: 72.9086, radius_km: 1.6, demand_level: 'low', est_earnings_per_hr: 180, avg_orders: 5, score: 52, city: 'Mumbai', area: 'Powai' },
                { cluster_id: 5, center_lat: 19.0474, center_lng: 72.8714, radius_km: 1.3, demand_level: 'high', est_earnings_per_hr: 310, avg_orders: 11, score: 89, city: 'Mumbai', area: 'Sion' },
                // Pune zones
                { cluster_id: 6, center_lat: 18.5362, center_lng: 73.8938, radius_km: 1.4, demand_level: 'high', est_earnings_per_hr: 280, avg_orders: 9, score: 85, city: 'Pune', area: 'Koregaon Park' },
                { cluster_id: 7, center_lat: 18.5912, center_lng: 73.7390, radius_km: 2.2, demand_level: 'high', est_earnings_per_hr: 300, avg_orders: 11, score: 90, city: 'Pune', area: 'Hinjewadi' },
                { cluster_id: 8, center_lat: 18.5679, center_lng: 73.9143, radius_km: 1.3, demand_level: 'medium', est_earnings_per_hr: 230, avg_orders: 7, score: 71, city: 'Pune', area: 'Viman Nagar' },
                { cluster_id: 9, center_lat: 18.5074, center_lng: 73.8077, radius_km: 1.5, demand_level: 'medium', est_earnings_per_hr: 220, avg_orders: 6, score: 65, city: 'Pune', area: 'Kothrud' },
                { cluster_id: 10, center_lat: 18.5089, center_lng: 73.9260, radius_km: 1.8, demand_level: 'low', est_earnings_per_hr: 190, avg_orders: 5, score: 55, city: 'Pune', area: 'Hadapsar' },
            ]
        };
        res.json({ success: true, data: mockClusters });
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
